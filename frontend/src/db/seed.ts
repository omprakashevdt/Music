import { Track } from "@/src/types";
import { DBShape } from "./store";

// Royalty-free demo audio (SoundHelix) so the full player flow works in the
// cloud preview where real on-device music files can't be accessed.
// On a real device, "Scan Music" adds local files alongside these.

const COVERS = {
  golden:
    "https://images.unsplash.com/photo-1687392946855-8e35efa25ad7?crop=entropy&cs=srgb&fm=jpg&w=600&q=80",
  midnight:
    "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?crop=entropy&cs=srgb&fm=jpg&w=600&q=80",
  neon:
    "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?crop=entropy&cs=srgb&fm=jpg&w=600&q=80",
  wander:
    "https://images.unsplash.com/photo-1501612780327-45045538702b?crop=entropy&cs=srgb&fm=jpg&w=600&q=80",
};

interface Seed {
  n: number;
  title: string;
  album: string;
  artist: string;
  genre: string;
  year: number;
  cover: string;
  duration: number;
  track: number;
}

const SEEDS: Seed[] = [
  { n: 1, title: "Golden Hour", album: "Golden Hour", artist: "Aurora Skies", genre: "Indie", year: 2021, cover: COVERS.golden, duration: 371, track: 1 },
  { n: 2, title: "Paper Lanterns", album: "Golden Hour", artist: "Aurora Skies", genre: "Indie", year: 2021, cover: COVERS.golden, duration: 328, track: 2 },
  { n: 3, title: "Slow Tide", album: "Golden Hour", artist: "Aurora Skies", genre: "Indie", year: 2021, cover: COVERS.golden, duration: 344, track: 3 },
  { n: 4, title: "Blue Note Cafe", album: "Midnight Sessions", artist: "Midnight Trio", genre: "Jazz", year: 2019, cover: COVERS.midnight, duration: 419, track: 1 },
  { n: 5, title: "After Hours", album: "Midnight Sessions", artist: "Midnight Trio", genre: "Jazz", year: 2019, cover: COVERS.midnight, duration: 296, track: 2 },
  { n: 6, title: "Velvet Room", album: "Midnight Sessions", artist: "Midnight Trio", genre: "Jazz", year: 2019, cover: COVERS.midnight, duration: 388, track: 3 },
  { n: 7, title: "Neon Coast", album: "Neon Coast", artist: "Neon Coast", genre: "Synthwave", year: 2023, cover: COVERS.neon, duration: 357, track: 1 },
  { n: 8, title: "Drive All Night", album: "Neon Coast", artist: "Neon Coast", genre: "Synthwave", year: 2023, cover: COVERS.neon, duration: 402, track: 2 },
  { n: 9, title: "Chrome Skyline", album: "Neon Coast", artist: "Neon Coast", genre: "Synthwave", year: 2023, cover: COVERS.neon, duration: 311, track: 3 },
  { n: 10, title: "Wander", album: "Wander", artist: "The Wanderers", genre: "Folk", year: 2016, cover: COVERS.wander, duration: 365, track: 1 },
  { n: 11, title: "Open Roads", album: "Wander", artist: "The Wanderers", genre: "Folk", year: 2016, cover: COVERS.wander, duration: 333, track: 2 },
  { n: 12, title: "Campfire", album: "Wander", artist: "The Wanderers", genre: "Folk", year: 2016, cover: COVERS.wander, duration: 289, track: 3 },
];

export function seedDemoLibrary(db: DBShape): void {
  const now = Date.now();
  const byId = new Map(db.tracks.map((t) => [t.id, t]));

  for (const s of SEEDS) {
    const id = `demo-${s.n}`;
    if (byId.has(id)) continue;
    const track: Track = {
      id,
      sourceType: "demo",
      mediaStoreId: null,
      contentUri: null,
      filePath: null,
      uri: `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${s.n}.mp3`,
      fileName: `${s.title}.mp3`,
      title: s.title,
      artist: s.artist,
      album: s.album,
      albumArtist: s.artist,
      genre: s.genre,
      year: s.year,
      trackNumber: s.track,
      discNumber: 1,
      composer: s.artist,
      duration: s.duration,
      artworkUri: s.cover,
      folder: `Music/${s.artist}`,
      fileSize: null,
      dateAdded: now - (SEEDS.length - s.n) * 3600000,
      lastPlayedAt: null,
      playCount: 0,
      isFavorite: 0,
    };
    db.tracks.push(track);
  }

  const set = (id: string, fields: Partial<Track>) => {
    const t = db.tracks.find((x) => x.id === id);
    if (t) Object.assign(t, fields);
  };
  set("demo-1", { isFavorite: 1, playCount: 8, lastPlayedAt: now - 5400000 });
  set("demo-7", { isFavorite: 1, playCount: 12, lastPlayedAt: now - 1800000 });
  set("demo-4", { playCount: 5, lastPlayedAt: now - 9000000 });

  if (!db.playlists.find((p) => p.id === "demo-playlist-1")) {
    db.playlists.push({
      id: "demo-playlist-1",
      name: "Late Night Drive",
      description: "Synth & jazz for empty highways",
      coverImagePath: COVERS.neon,
      themeColor: "#EAA33A",
      createdAt: now,
      updatedAt: now,
    });
    const ids = ["demo-7", "demo-8", "demo-4", "demo-5", "demo-9"];
    ids.forEach((trackId, i) =>
      db.playlistTracks.push({ playlistId: "demo-playlist-1", trackId, position: i, addedAt: now }),
    );
  }
}
