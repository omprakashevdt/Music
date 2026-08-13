import { create } from "zustand";

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
}

interface ConfirmState {
  options: ConfirmOptions | null;
  open: (o: ConfirmOptions) => void;
  close: () => void;
}

export const useConfirmStore = create<ConfirmState>((set) => ({
  options: null,
  open: (options) => set({ options }),
  close: () => set({ options: null }),
}));

export const confirm = (o: ConfirmOptions) => useConfirmStore.getState().open(o);
