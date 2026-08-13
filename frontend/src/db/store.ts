// Local JSON-backed data store. Works identically on web (preview + testing)
// and native (device), fully offline, persisted through the storage util.
// Kept small and normalized; all query logic lives in repo.ts.

import { storage } from "@/src/utils/storage";
import { Playlist, Track } from "@/src/types";
import { seedDemoLibrary } from "./seed";

const KEY = "resonance.db.v2";

export interface PlaylistTrack {
  playlistId: string;
  trackId: string;
  position: number;
  addedAt: number;
}

export interface DBShape {
  tracks: Track[];
  playlists: Playlist[];
  playlistTracks: PlaylistTrack[];
  searchHistory: { query: string; searchedAt: number }[];
  settings: Record<string, string>;
}

function emptyDB(): DBShape {
  return {
    tracks: [],
    playlists: [],
    playlistTracks: [],
    searchHistory: [],
    settings: {},
  };
}

let db: DBShape | null = null;
let loadPromise: Promise<DBShape> | null = null;
let saveTimer: ReturnType<typeof setTimeout> | null = null;

export async function loadDB(): Promise<DBShape> {
  if (db) return db;
  if (!loadPromise) {
    loadPromise = (async () => {
      const raw = (await storage.getItem(KEY, null as never)) as DBShape | null;
      if (raw && Array.isArray(raw.tracks)) {
        db = { ...emptyDB(), ...raw };
      } else {
        db = emptyDB();
        seedDemoLibrary(db);
        await persist();
      }
      return db;
    })();
  }
  return loadPromise;
}

export function getDB(): DBShape {
  if (!db) throw new Error("DB not loaded");
  return db;
}

export async function persist(): Promise<void> {
  if (!db) return;
  await storage.setItem(KEY, db as never);
}

export function schedulePersist(): void {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    persist();
  }, 250);
}

export async function resetDB(reseed: boolean): Promise<void> {
  db = emptyDB();
  if (reseed) {
    seedDemoLibrary(db);
  }
  await persist();
}
