export type SourceType = "mediastore" | "saf" | "file" | "demo";

export interface Track {
  id: string;
  sourceType: SourceType;
  mediaStoreId: string | null;
  contentUri: string | null;
  filePath: string | null;
  uri: string;
  fileName: string;
  title: string;
  artist: string;
  album: string;
  albumArtist: string | null;
  genre: string;
  year: number | null;
  trackNumber: number | null;
  discNumber: number | null;
  composer: string | null;
  duration: number; // seconds
  artworkUri: string | null;
  folder: string;
  fileSize: number | null;
  dateAdded: number;
  lastPlayedAt: number | null;
  playCount: number;
  isFavorite: number; // 0 | 1
}

export interface Playlist {
  id: string;
  name: string;
  description: string | null;
  coverImagePath: string | null;
  themeColor: string | null;
  createdAt: number;
  updatedAt: number;
  trackCount?: number;
  coverFromTrack?: string | null;
}

export interface ArtistGroup {
  name: string;
  trackCount: number;
  albumCount: number;
  artworkUri: string | null;
}

export interface AlbumGroup {
  name: string;
  artist: string;
  year: number | null;
  trackCount: number;
  artworkUri: string | null;
}

export interface GenreGroup {
  name: string;
  trackCount: number;
  artworkUri: string | null;
}

export interface YearGroup {
  year: number;
  trackCount: number;
}

export interface FolderGroup {
  name: string;
  trackCount: number;
}

export type SongSort =
  | "title"
  | "artist"
  | "album"
  | "dateAdded"
  | "playCount"
  | "year";

export type ThemeMode = "light" | "dark" | "system";
export type RepeatMode = "off" | "one" | "all";
