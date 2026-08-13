import * as MediaLibrary from "expo-media-library";
import { create } from "zustand";

import { insertTracks } from "@/src/db/repo";
import { bumpLibrary } from "@/src/store/libraryStore";
import { Track } from "@/src/types";

interface ScanProgress {
  scanning: boolean;
  discovered: number;
  processed: number;
  added: number;
  error: string | null;
}

export const useScannerStore = create<
  ScanProgress & { reset: () => void; run: () => Promise<void> }
>((set, get) => ({
  scanning: false,
  discovered: 0,
  processed: 0,
  added: 0,
  error: null,
  reset: () =>
    set({ scanning: false, discovered: 0, processed: 0, added: 0, error: null }),

  run: async () => {
    if (get().scanning) return;
    set({ scanning: true, discovered: 0, processed: 0, added: 0, error: null });

    const perm = await MediaLibrary.getPermissionsAsync();
    let granted = perm.granted;
    if (!granted && perm.canAskAgain) {
      const req = await MediaLibrary.requestPermissionsAsync();
      granted = req.granted;
    }
    if (!granted) {
      set({
        scanning: false,
        error: "Media permission is required to scan your music.",
      });
      return;
    }

    try {
      const batch: Track[] = [];
      let after: MediaLibrary.AssetRef | undefined;
      let hasNext = true;
      const now = Date.now();

      while (hasNext) {
        const page = await MediaLibrary.getAssetsAsync({
          mediaType: MediaLibrary.MediaType.audio,
          first: 100,
          after,
          sortBy: [MediaLibrary.SortBy.creationTime],
        });
        set({ discovered: get().discovered + page.assets.length });

        for (const asset of page.assets) {
          const fileName = asset.filename ?? "Unknown";
          const base = fileName.replace(/\.[^/.]+$/, "");
          let artist = "Unknown Artist";
          let title = base;
          const dash = base.split(" - ");
          if (dash.length >= 2) {
            artist = dash[0].trim();
            title = dash.slice(1).join(" - ").trim();
          }
          const folderMatch = asset.uri.match(/\/([^/]+)\/[^/]+$/);
          const folder = folderMatch ? folderMatch[1] : "Device";

          batch.push({
            id: `ms-${asset.id}`,
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
            year: asset.creationTime
              ? new Date(asset.creationTime).getFullYear()
              : null,
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
          set({ processed: get().processed + 1 });
        }

        if (batch.length >= 200) {
          await insertTracks(batch.splice(0, batch.length));
          set({ added: get().processed });
        }
        hasNext = page.hasNextPage;
        after = page.endCursor;
      }

      if (batch.length) await insertTracks(batch);
      set({ scanning: false, added: get().processed });
      bumpLibrary();
    } catch (e) {
      set({ scanning: false, error: "Something went wrong while scanning." });
    }
  },
}));
