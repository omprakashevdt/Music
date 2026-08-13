import {
  AlbumGroup,
  ArtistGroup,
  FolderGroup,
  GenreGroup,
  Playlist,
  SongSort,
  Track,
  YearGroup,
} from "@/src/types";
import { loadDB, resetDB, schedulePersist } from "./store";
import { seedDemoLibrary } from "./seed";

function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

const ci = (s: string) => (s ?? "").toLowerCase();

function sortTracks(list: Track[], sort: SongSort): Track[] {
  const arr = [...list];
  switch (sort) {
    case "title":
      arr.sort((a, b) => ci(a.title).localeCompare(ci(b.title)));
      break;
    case "artist":
      arr.sort(
        (a, b) =>
          ci(a.artist).localeCompare(ci(b.artist)) ||
          ci(a.album).localeCompare(ci(b.album)) ||
          (a.trackNumber ?? 0) - (b.trackNumber ?? 0),
      );
      break;
    case "album":
      arr.sort(
        (a, b) =>
          ci(a.album).localeCompare(ci(b.album)) ||
          (a.trackNumber ?? 0) - (b.trackNumber ?? 0),
      );
      break;
    case "dateAdded":
      arr.sort((a, b) => b.dateAdded - a.dateAdded);
      break;
    case "playCount":
      arr.sort((a, b) => b.playCount - a.playCount || (b.lastPlayedAt ?? 0) - (a.lastPlayedAt ?? 0));
      break;
    case "year":
      arr.sort((a, b) => (b.year ?? 0) - (a.year ?? 0) || ci(a.album).localeCompare(ci(b.album)));
      break;
  }
  return arr;
}

/* ---------------- Tracks ---------------- */

export async function getAllTracks(sort: SongSort = "title"): Promise<Track[]> {
  const db = await loadDB();
  return sortTracks(db.tracks, sort);
}

export async function getTrackById(id: string): Promise<Track | null> {
  const db = await loadDB();
  return db.tracks.find((t) => t.id === id) ?? null;
}

export async function getFavorites(): Promise<Track[]> {
  const db = await loadDB();
  return sortTracks(db.tracks.filter((t) => t.isFavorite === 1), "title");
}

export async function toggleFavorite(id: string): Promise<void> {
  const db = await loadDB();
  const t = db.tracks.find((x) => x.id === id);
  if (t) {
    t.isFavorite = t.isFavorite === 1 ? 0 : 1;
    schedulePersist();
  }
}

export async function incrementPlayCount(id: string): Promise<void> {
  const db = await loadDB();
  const t = db.tracks.find((x) => x.id === id);
  if (t) {
    t.playCount += 1;
    t.lastPlayedAt = Date.now();
    schedulePersist();
  }
}

export async function recordPlay(): Promise<void> {
  // History is captured through lastPlayedAt/playCount; kept for API parity.
}

export async function getRecentlyPlayed(limit = 20): Promise<Track[]> {
  const db = await loadDB();
  return db.tracks
    .filter((t) => t.lastPlayedAt != null)
    .sort((a, b) => (b.lastPlayedAt ?? 0) - (a.lastPlayedAt ?? 0))
    .slice(0, limit);
}

export async function getRecentlyAdded(limit = 20): Promise<Track[]> {
  const db = await loadDB();
  return [...db.tracks].sort((a, b) => b.dateAdded - a.dateAdded).slice(0, limit);
}

export async function getMostPlayed(limit = 20): Promise<Track[]> {
  const db = await loadDB();
  return db.tracks
    .filter((t) => t.playCount > 0)
    .sort((a, b) => b.playCount - a.playCount)
    .slice(0, limit);
}

export async function updateTrackMeta(
  id: string,
  fields: Partial<Pick<Track, "title" | "artist" | "album" | "genre" | "year">>,
): Promise<void> {
  const db = await loadDB();
  const t = db.tracks.find((x) => x.id === id);
  if (t) {
    Object.assign(t, fields);
    schedulePersist();
  }
}

export async function insertTracks(tracks: Track[]): Promise<void> {
  const db = await loadDB();
  const byId = new Map(db.tracks.map((t, i) => [t.id, i]));
  for (const t of tracks) {
    const idx = byId.get(t.id);
    if (idx != null) db.tracks[idx] = t;
    else db.tracks.push(t);
  }
  schedulePersist();
}

/* ---------------- Grouping ---------------- */

export async function getArtists(): Promise<ArtistGroup[]> {
  const db = await loadDB();
  const map = new Map<string, { tracks: number; albums: Set<string>; art: string | null }>();
  for (const t of db.tracks) {
    const g = map.get(t.artist) ?? { tracks: 0, albums: new Set<string>(), art: null };
    g.tracks += 1;
    g.albums.add(t.album);
    if (!g.art && t.artworkUri) g.art = t.artworkUri;
    map.set(t.artist, g);
  }
  return [...map.entries()]
    .map(([name, g]) => ({ name, trackCount: g.tracks, albumCount: g.albums.size, artworkUri: g.art }))
    .sort((a, b) => ci(a.name).localeCompare(ci(b.name)));
}

export async function getAlbums(): Promise<AlbumGroup[]> {
  const db = await loadDB();
  const map = new Map<string, AlbumGroup>();
  for (const t of db.tracks) {
    const key = `${t.album}::${t.artist}`;
    const g = map.get(key);
    if (g) {
      g.trackCount += 1;
      if (!g.artworkUri && t.artworkUri) g.artworkUri = t.artworkUri;
      if ((g.year ?? 0) < (t.year ?? 0)) g.year = t.year;
    } else {
      map.set(key, { name: t.album, artist: t.artist, year: t.year, trackCount: 1, artworkUri: t.artworkUri });
    }
  }
  return [...map.values()].sort((a, b) => ci(a.name).localeCompare(ci(b.name)));
}

export async function getGenres(): Promise<GenreGroup[]> {
  const db = await loadDB();
  const map = new Map<string, GenreGroup>();
  for (const t of db.tracks) {
    const g = map.get(t.genre);
    if (g) {
      g.trackCount += 1;
      if (!g.artworkUri && t.artworkUri) g.artworkUri = t.artworkUri;
    } else map.set(t.genre, { name: t.genre, trackCount: 1, artworkUri: t.artworkUri });
  }
  return [...map.values()].sort((a, b) => ci(a.name).localeCompare(ci(b.name)));
}

export async function getYears(): Promise<YearGroup[]> {
  const db = await loadDB();
  const map = new Map<number, number>();
  for (const t of db.tracks) if (t.year != null) map.set(t.year, (map.get(t.year) ?? 0) + 1);
  return [...map.entries()]
    .map(([year, trackCount]) => ({ year, trackCount }))
    .sort((a, b) => b.year - a.year);
}

export async function getFolders(): Promise<FolderGroup[]> {
  const db = await loadDB();
  const map = new Map<string, number>();
  for (const t of db.tracks) map.set(t.folder, (map.get(t.folder) ?? 0) + 1);
  return [...map.entries()]
    .map(([name, trackCount]) => ({ name, trackCount }))
    .sort((a, b) => ci(a.name).localeCompare(ci(b.name)));
}

export async function getTracksByArtist(name: string): Promise<Track[]> {
  const db = await loadDB();
  return sortTracks(db.tracks.filter((t) => t.artist === name), "album");
}

export async function getTracksByAlbum(name: string): Promise<Track[]> {
  const db = await loadDB();
  return db.tracks
    .filter((t) => t.album === name)
    .sort((a, b) => (a.trackNumber ?? 0) - (b.trackNumber ?? 0));
}

export async function getTracksByGenre(name: string): Promise<Track[]> {
  const db = await loadDB();
  return sortTracks(db.tracks.filter((t) => t.genre === name), "title");
}

export async function getTracksByYear(year: number): Promise<Track[]> {
  const db = await loadDB();
  return sortTracks(db.tracks.filter((t) => t.year === year), "title");
}

export async function getTracksByFolder(name: string): Promise<Track[]> {
  const db = await loadDB();
  return db.tracks
    .filter((t) => t.folder === name)
    .sort((a, b) => (a.trackNumber ?? 0) - (b.trackNumber ?? 0));
}

/* ---------------- Search ---------------- */

export async function searchTracks(q: string): Promise<Track[]> {
  const db = await loadDB();
  const needle = ci(q);
  return db.tracks
    .filter(
      (t) =>
        ci(t.title).includes(needle) ||
        ci(t.artist).includes(needle) ||
        ci(t.album).includes(needle) ||
        ci(t.genre).includes(needle) ||
        ci(t.folder).includes(needle),
    )
    .sort((a, b) => ci(a.title).localeCompare(ci(b.title)))
    .slice(0, 100);
}

export async function addSearchHistory(q: string): Promise<void> {
  const trimmed = q.trim();
  if (!trimmed) return;
  const db = await loadDB();
  db.searchHistory = db.searchHistory.filter((h) => h.query !== trimmed);
  db.searchHistory.unshift({ query: trimmed, searchedAt: Date.now() });
  db.searchHistory = db.searchHistory.slice(0, 12);
  schedulePersist();
}

export async function getSearchHistory(): Promise<string[]> {
  const db = await loadDB();
  return db.searchHistory.map((h) => h.query);
}

export async function clearSearchHistory(): Promise<void> {
  const db = await loadDB();
  db.searchHistory = [];
  schedulePersist();
}

/* ---------------- Playlists ---------------- */

export async function getPlaylists(): Promise<Playlist[]> {
  const db = await loadDB();
  return [...db.playlists]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .map((p) => {
      const links = db.playlistTracks
        .filter((pt) => pt.playlistId === p.id)
        .sort((a, b) => a.position - b.position);
      const firstTrack = links[0] ? db.tracks.find((t) => t.id === links[0].trackId) : null;
      return { ...p, trackCount: links.length, coverFromTrack: firstTrack?.artworkUri ?? null };
    });
}

export async function getPlaylist(id: string): Promise<Playlist | null> {
  const db = await loadDB();
  const p = db.playlists.find((x) => x.id === id);
  if (!p) return null;
  const trackCount = db.playlistTracks.filter((pt) => pt.playlistId === id).length;
  return { ...p, trackCount };
}

export async function getPlaylistTracks(id: string): Promise<Track[]> {
  const db = await loadDB();
  return db.playlistTracks
    .filter((pt) => pt.playlistId === id)
    .sort((a, b) => a.position - b.position)
    .map((pt) => db.tracks.find((t) => t.id === pt.trackId))
    .filter((t): t is Track => !!t);
}

export async function createPlaylist(
  name: string,
  description: string | null,
  coverImagePath: string | null,
  themeColor: string | null,
): Promise<string> {
  const db = await loadDB();
  const id = uid("pl");
  const now = Date.now();
  db.playlists.push({ id, name, description, coverImagePath, themeColor, createdAt: now, updatedAt: now });
  schedulePersist();
  return id;
}

export async function updatePlaylist(
  id: string,
  fields: Partial<Pick<Playlist, "name" | "description" | "coverImagePath" | "themeColor">>,
): Promise<void> {
  const db = await loadDB();
  const p = db.playlists.find((x) => x.id === id);
  if (p) {
    Object.assign(p, fields);
    p.updatedAt = Date.now();
    schedulePersist();
  }
}

export async function deletePlaylist(id: string): Promise<void> {
  const db = await loadDB();
  db.playlists = db.playlists.filter((p) => p.id !== id);
  db.playlistTracks = db.playlistTracks.filter((pt) => pt.playlistId !== id);
  schedulePersist();
}

export async function addTrackToPlaylist(playlistId: string, trackId: string): Promise<void> {
  const db = await loadDB();
  if (db.playlistTracks.some((pt) => pt.playlistId === playlistId && pt.trackId === trackId)) return;
  const max = db.playlistTracks
    .filter((pt) => pt.playlistId === playlistId)
    .reduce((m, pt) => Math.max(m, pt.position), -1);
  db.playlistTracks.push({ playlistId, trackId, position: max + 1, addedAt: Date.now() });
  const p = db.playlists.find((x) => x.id === playlistId);
  if (p) p.updatedAt = Date.now();
  schedulePersist();
}

export async function removeTrackFromPlaylist(playlistId: string, trackId: string): Promise<void> {
  const db = await loadDB();
  db.playlistTracks = db.playlistTracks.filter(
    (pt) => !(pt.playlistId === playlistId && pt.trackId === trackId),
  );
  schedulePersist();
}

export async function reorderPlaylist(playlistId: string, orderedTrackIds: string[]): Promise<void> {
  const db = await loadDB();
  orderedTrackIds.forEach((trackId, i) => {
    const pt = db.playlistTracks.find((x) => x.playlistId === playlistId && x.trackId === trackId);
    if (pt) pt.position = i;
  });
  schedulePersist();
}

/* ---------------- Settings ---------------- */

export async function getSetting(key: string, fallback: string): Promise<string> {
  const db = await loadDB();
  return db.settings[key] ?? fallback;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const db = await loadDB();
  db.settings[key] = value;
  schedulePersist();
}

/* ---------------- Maintenance ---------------- */

export async function clearPlaybackHistory(): Promise<void> {
  const db = await loadDB();
  for (const t of db.tracks) {
    t.lastPlayedAt = null;
    t.playCount = 0;
  }
  schedulePersist();
}

export async function resetLibrary(): Promise<void> {
  await resetDB(false);
}

export async function restoreDemoLibrary(): Promise<void> {
  const db = await loadDB();
  seedDemoLibrary(db);
  schedulePersist();
}

export async function getLibraryStats(): Promise<{ tracks: number; albums: number; artists: number }> {
  const db = await loadDB();
  return {
    tracks: db.tracks.length,
    albums: new Set(db.tracks.map((t) => t.album)).size,
    artists: new Set(db.tracks.map((t) => t.artist)).size,
  };
}
