import { create } from "zustand";

interface ToastState {
  message: string | null;
  show: (msg: string) => void;
  hide: () => void;
}

let handle: ReturnType<typeof setTimeout> | null = null;

export const useToastStore = create<ToastState>((set) => ({
  message: null,
  show: (message) => {
    if (handle) clearTimeout(handle);
    set({ message });
    handle = setTimeout(() => set({ message: null }), 2200);
  },
  hide: () => set({ message: null }),
}));

export const toast = (msg: string) => useToastStore.getState().show(msg);
