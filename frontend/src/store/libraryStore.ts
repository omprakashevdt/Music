import { create } from "zustand";

// Bumped whenever the library data changes (favorite toggled, playlist edited,
// scan finished, metadata edited) so screens can re-query.
interface LibraryState {
  version: number;
  bump: () => void;
}

export const useLibraryStore = create<LibraryState>((set) => ({
  version: 0,
  bump: () => set((s) => ({ version: s.version + 1 })),
}));

export const bumpLibrary = () => useLibraryStore.getState().bump();
