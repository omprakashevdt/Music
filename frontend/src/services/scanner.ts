import * as MediaLibrary from "expo-media-library";
import { create } from "zustand";

import { getExistingTrackIds, insertTracks } from "@/src/db/repo";
import { bumpLibrary } from "@/src/store/libraryStore";
import { toast } from "@/src/store/toastStore";
import { Track } from "@/src/types";

interface ScanProgress {
  scanning: boolean;
  discovered: number; // assets seen this scan
  processed: number; // assets examined this scan
  added: number; // NEW tracks imported this scan
  skipped: number; // already-in-library tracks skipped
  error: string | null;
}

export const useScannerStore = create<
  ScanProgress & { reset: () => void; run: () => Promise<void> }
>((set, get) => ({
  scanning: false,
  discovered: 0,
  processed: 0,
  added: 0,
  skipped: 0,
  error: null,
  reset: () =>
    set({ scanning: false, discovered: 0, processed: 0, added: 0, skipped: 0, error: null }),

  run: async () => {
    if (get().scanning) return;
    set({ scanning: true, discovered: 0, processed: 0, added: 0, skipped: 0, error: null });

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
      // Incremental scan: remember what we already have so re-scans only
      // import genuinely new files. Assets are read newest-first, so once we
      // hit a full page of already-known files we can stop early.
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
          added += 1;
        }

        set({ processed: examined, added, skipped });

        if (batch.length >= 200) {
          await insertTracks(batch.splice(0, batch.length));
        }

        // Early exit: newest-first ordering means a full page with no new
        // files implies everything beyond is already imported.
        if (page.assets.length > 0 && newInPage === 0) break;

        hasNext = page.hasNextPage;
        after = page.endCursor;
      }

      if (batch.length) await insertTracks(batch);
      set({ scanning: false, added, skipped });
      if (added > 0) bumpLibrary();
      toast(
        added > 0
          ? `Added ${added} new song${added === 1 ? "" : "s"}`
          : "Library is already up to date",
      );
    } catch {
      set({ scanning: false, error: "Something went wrong while scanning." });
    }
  },
}));
