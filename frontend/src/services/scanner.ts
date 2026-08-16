import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library";
import { create } from "zustand";

import { getExistingTrackIds, insertTracks } from "@/src/db/repo";
import { bumpLibrary } from "@/src/store/libraryStore";
import { toast } from "@/src/store/toastStore";
import { Track } from "@/src/types";

export type ScanMode = "idle" | "scanning" | "importing";

interface ScannerState {
  mode: ScanMode;
  discovered: number;
  processed: number;
  added: number;
  skipped: number;
  total: number;
  error: string | null;
  blocked: boolean;
  reset: () => void;
  run: () => Promise<void>;
  importFiles: () => Promise<void>;
}

function hash(str: string): string {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h).toString(36);
}

function parseName(fileName: string): { title: string; artist: string } {
  const base = fileName.replace(/\.[^/.]+$/, "");
  const dash = base.split(" - ");
  if (dash.length >= 2) {
    return { artist: dash[0].trim(), title: dash.slice(1).join(" - ").trim() };
  }
  return { artist: "Unknown Artist", title: base };
}

export const useScannerStore = create<ScannerState>((set, get) => ({
  mode: "idle",
  discovered: 0,
  processed: 0,
  added: 0,
  skipped: 0,
  total: 0,
  error: null,
  blocked: false,
  reset: () =>
    set({ mode: "idle", discovered: 0, processed: 0, added: 0, skipped: 0, total: 0, error: null, blocked: false }),

  /* ---- Scan the device MediaStore (works in Expo Go on a real device) ---- */
  run: async () => {
    if (get().mode !== "idle") return;
    set({ mode: "scanning", discovered: 0, processed: 0, added: 0, skipped: 0, total: 0, error: null, blocked: false });

    try {
      let perm = await MediaLibrary.getPermissionsAsync();
      if (!perm.granted && perm.canAskAgain) {
        perm = await MediaLibrary.requestPermissionsAsync();
      }
      if (!perm.granted) {
        set({
          blocked: !perm.canAskAgain,
          error: perm.canAskAgain
            ? "Music access was denied. Tap Scan again to allow it."
            : "Music access is blocked. Open Settings to allow it, then scan again.",
        });
        return;
      }

      const known = await getExistingTrackIds();
      const batch: Track[] = [];
      let after: MediaLibrary.AssetRef | undefined;
      let hasNext = true;
      let added = 0;
      let skipped = 0;
      let examined = 0;
      const now = Date.now();

      while (hasNext) {
        const page = await MediaLibrary.getAssetsAsync({
          mediaType: MediaLibrary.MediaType.audio,
          first: 100,
          after,
          sortBy: [[MediaLibrary.SortBy.creationTime, false]],
        });
        set({ discovered: get().discovered + page.assets.length });

        let newInPage = 0;
        for (const asset of page.assets) {
          examined += 1;
          const id = `ms-${asset.id}`;
          if (known.has(id)) {
            skipped += 1;
            continue;
          }
          known.add(id);
          newInPage += 1;

          const fileName = asset.filename ?? "Unknown";
          const { title, artist } = parseName(fileName);
          const folderMatch = asset.uri.match(/\/([^/]+)\/[^/]+$/);
          const folder = folderMatch ? folderMatch[1] : "Device";

          batch.push({
            id,
            sourceType: "mediastore",
            mediaStoreId: asset.id,
            contentUri: asset.uri,
            filePath: null,
            uri: asset.uri,
            fileName,
            title,
            artist,
            album: "Unknown Album",
            albumArtist: artist,
            genre: "Unknown",
            year: asset.creationTime ? new Date(asset.creationTime).getFullYear() : null,
            trackNumber: null,
            discNumber: null,
            composer: null,
            duration: asset.duration ?? 0,
            artworkUri: null,
            folder,
            fileSize: null,
            dateAdded: now,
            lastPlayedAt: null,
            playCount: 0,
            isFavorite: 0,
          });
          added += 1;
        }

        set({ processed: examined, added, skipped });
        if (batch.length >= 200) await insertTracks(batch.splice(0, batch.length));
        if (page.assets.length > 0 && newInPage === 0) break;
        hasNext = page.hasNextPage;
        after = page.endCursor;
      }

      if (batch.length) await insertTracks(batch);
      if (added > 0) bumpLibrary();
      toast(
        added > 0
          ? `Added ${added} new song${added === 1 ? "" : "s"}`
          : examined === 0
            ? "No music files found on this device"
            : "Library is already up to date",
      );
    } catch {
      set({ error: "Something went wrong while scanning." });
    } finally {
      set({ mode: "idle" });
    }
  },

  /* ---- Manually pick audio files via the system file picker ---- */
  importFiles: async () => {
    if (get().mode !== "idle") return;
    set({ mode: "importing", total: 0, processed: 0, added: 0, error: null, blocked: false });

    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: "audio/*",
        multiple: true,
        copyToCacheDirectory: true,
      });
      if (res.canceled) return;

      const assets = res.assets ?? [];
      set({ total: assets.length });
      if (assets.length === 0) return;

      const known = await getExistingTrackIds();
      const dir = `${FileSystem.documentDirectory}music/`;
      try {
        await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
      } catch {
        // directory may already exist
      }

      const batch: Track[] = [];
      let added = 0;
      const now = Date.now();

      for (let i = 0; i < assets.length; i++) {
        const a = assets[i];
        set({ processed: i + 1 });
        const fileName = a.name ?? `track-${i}.mp3`;
        const id = `file-${hash(fileName + (a.size ?? 0))}`;
        if (known.has(id)) continue;
        known.add(id);

        // Persist the picked file into the app's document directory.
        const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
        let dest = `${dir}${Date.now()}_${i}_${safe}`;
        try {
          await FileSystem.copyAsync({ from: a.uri, to: dest });
        } catch {
          dest = a.uri; // fall back to the picker uri
        }

        const { title, artist } = parseName(fileName);
        batch.push({
          id,
          sourceType: "file",
          mediaStoreId: null,
          contentUri: null,
          filePath: dest,
          uri: dest,
          fileName,
          title,
          artist,
          album: "Imported",
          albumArtist: artist,
          genre: "Unknown",
          year: null,
          trackNumber: null,
          discNumber: null,
          composer: null,
          duration: 0,
          artworkUri: null,
          folder: "Imported",
          fileSize: a.size ?? null,
          dateAdded: now,
          lastPlayedAt: null,
          playCount: 0,
          isFavorite: 0,
        });
        added += 1;
        set({ added });
      }

      if (batch.length) await insertTracks(batch);
      if (added > 0) bumpLibrary();
      toast(
        added > 0
          ? `Imported ${added} song${added === 1 ? "" : "s"}`
          : "Those songs are already in your library",
      );
    } catch {
      set({ error: "Couldn't import those files. Please try again." });
    } finally {
      set({ mode: "idle" });
    }
  },
}));
