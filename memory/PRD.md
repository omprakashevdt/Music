# Resonance — Offline Music Player (PRD & Build Log)

## Original Problem Statement
Build a beautiful, fast, private, **100% offline** local music player (Expo/React Native).
Browse Songs/Artists/Albums/Genres/Years/Folders, fast search, unlimited playlists with
custom cover images + color themes, favorites, recently played/added/most played, background
playback with lock-screen/Bluetooth controls, shuffle/repeat, sleep timer, edit metadata,
rescan device library. Feels like "a personal, private, ad-free Spotify-style library — fully local."

## User Choices (from intake)
- Full Expo build now (background/lockscreen controls work only after generating a native build).
- Seed demo tracks so all flows are demoable in the cloud web preview.
- Theme: Light + Dark + System toggle.
- Priorities: Library browsing + Search; Playlists w/ custom covers; Now Playing + Mini-player + Queue; Favorites/Recently Played/Most Played/Sleep Timer.

## Architecture
- **Frontend only** (no backend, no auth, no accounts, no network sync). Fully local & private.
- **Design system "Resonance"**: Glass/Luxe, antique-gold amber accent (#EAA33A), Fraunces (display serif) + Manrope (text). Light/Dark/System via ThemeProvider.
- **Navigation**: expo-router. Bottom tabs (Home/Library/Playlists/Search/Settings) + stack modals (player, queue, edit/[id], playlist/edit/[id]) + detail routes (album/artist/genre/year/folder/playlist).
- **Data layer**: local JSON store (`src/db/store.ts`) persisted via the storage util, with a SQL-free repository (`src/db/repo.ts`) exposing the same API surface across web + native.
  - NOTE: expo-sqlite's web worker fails to load in the Emergent web preview (and the testing runner is web-based), so a JS store was used to keep the app fully demoable/testable on both web and device. Fine for realistic personal libraries; a native SQLite adapter could be swapped in later for very large (20k+) libraries.
- **Audio**: expo-audio singleton in `src/store/playerStore.ts` (zustand) — queue, play/pause, next/prev, seek, shuffle, repeat, auto-advance, play-count tracking, sleep timer. Background mode + lock-screen controls configured in app.json (device-build only).
- **Library scan**: `src/services/scanner.ts` uses expo-media-library (MediaStore) with contextual permission handling (device only).

## Implemented (2026-06-13)
- Home: greeting header, quick-access chips, carousels (Recently played, Most played, Your playlists, Recently added), favorites shortcut.
- Library: 7 segments (Songs/Artists/Albums/Genres/Years/Folders/Favorites) + 6 sort options for songs.
- Now Playing: blurred-artwork backdrop, big artwork, seekable slider, shuffle/prev/play-pause/next/repeat, favorite, add-to-playlist, queue, sleep timer.
- Mini-player: frosted glass, progress bar, play/pause + next, tap to open player.
- Queue: jump/remove/clear/save-as-playlist.
- Playlists: grid, create/edit with gallery cover image (base64) + theme color, delete, remove tracks, detail w/ play & shuffle.
- Search: live filtering across title/artist/album/genre/folder, recent-search history.
- Song options bottom sheet: play next, add to queue, add to playlist, favorite, go to album/artist, edit info.
- Edit metadata (in-app library only; original file untouched).
- Settings: theme mode, playback defaults, scan music, restore demo, clear history, reset library, privacy note. Toast + custom confirm dialog (no native Alert).
- Demo library auto-seeded (12 songs / 4 albums / 4 artists / 1 playlist) with royalty-free audio.

## Verified
- Testing agent (frontend): 100% of requested flows passing, no blockers. `/app/test_reports/iteration_1.json`.
- Manual: Home renders seeded data; Now Playing plays audio (position advances, play/pause toggles).

## Device-build-only (won't work in Expo Go preview)
- Background/lock-screen/Bluetooth playback controls.
- Real device music scanning (expo-media-library) — demo tracks used in preview.
- SAF custom-folder picker (folders currently derived from file paths).

## Backlog
- P1: Reorderable queue & playlist (drag handles); real dominant-color extraction from artwork.
- P1: Native SQLite adapter for very large libraries.
- P2: SAF folder-source picker; embedded-artwork/tag extraction on device; equalizer; gapless playback.
