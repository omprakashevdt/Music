import {
  AudioPlayer,
  AudioStatus,
  createAudioPlayer,
  setAudioModeAsync,
} from "expo-audio";
import * as Haptics from "expo-haptics";
import { create } from "zustand";

import { incrementPlayCount, recordPlay } from "@/src/db/repo";
import { RepeatMode, Track } from "@/src/types";
import { bumpLibrary } from "./libraryStore";

let player: AudioPlayer | null = null;
let subscription: { remove: () => void } | null = null;
let countedId: string | null = null;
let audioConfigured = false;

interface PlayerState {
  queue: Track[];
  currentIndex: number;
  current: Track | null;
  isPlaying: boolean;
  position: number;
  duration: number;
  shuffle: boolean;
  repeat: RepeatMode;
  hasSession: boolean;

  playQueue: (tracks: Track[], index: number) => Promise<void>;
  toggle: () => void;
  next: (auto?: boolean) => void;
  prev: () => void;
  seek: (seconds: number) => void;
  setShuffle: (v: boolean) => void;
  cycleRepeat: () => void;
  playNext: (track: Track) => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  reorderQueue: (from: number, to: number) => void;
  clearQueue: () => void;
}

async function ensureAudioMode() {
  if (audioConfigured) return;
  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: "duckOthers",
    });
  } catch {
    // ignore — best effort on web/preview
  }
  audioConfigured = true;
}

function attachListener() {
  if (!player) return;
  subscription?.remove();
  subscription = player.addListener(
    "playbackStatusUpdate",
    (status: AudioStatus) => {
      const s = useAudioStore.getState();
      const duration =
        status.duration && status.duration > 0
          ? status.duration
          : s.current?.duration ?? 0;
      useAudioStore.setState({
        position: status.currentTime ?? 0,
        duration,
        isPlaying: status.playing,
      });

      const cur = s.current;
      if (
        cur &&
        countedId !== cur.id &&
        status.currentTime > Math.min(30, (duration || 9999) * 0.4)
      ) {
        countedId = cur.id;
        incrementPlayCount(cur.id).then(bumpLibrary);
        recordPlay();
      }

      if (status.didJustFinish) {
        const sleep = useSleepStore.getState();
        if (sleep.endsAt === -1) {
          sleep.cancel();
          player?.pause();
          useAudioStore.setState({ isPlaying: false });
          return;
        }
        s.next(true);
      }
    },
  );
}

async function loadIndex(index: number) {
  const { queue } = useAudioStore.getState();
  const track = queue[index];
  if (!track) return;
  await ensureAudioMode();
  countedId = null;
  try {
    if (!player) {
      player = createAudioPlayer({ uri: track.uri }, 300);
      attachListener();
    } else {
      player.replace({ uri: track.uri });
    }
    player.play();
  } catch {
    // ignore load errors for a single track
  }
  useAudioStore.setState({
    currentIndex: index,
    current: track,
    isPlaying: true,
    position: 0,
    duration: track.duration || 0,
    hasSession: true,
  });
}

export const useAudioStore = create<PlayerState>((set, get) => ({
  queue: [],
  currentIndex: -1,
  current: null,
  isPlaying: false,
  position: 0,
  duration: 0,
  shuffle: false,
  repeat: "off",
  hasSession: false,

  playQueue: async (tracks, index) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    set({ queue: tracks });
    await loadIndex(index);
  },

  toggle: () => {
    if (!player) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    if (get().isPlaying) {
      player.pause();
      set({ isPlaying: false });
    } else {
      player.play();
      set({ isPlaying: true });
    }
  },

  next: (auto = false) => {
    const { queue, currentIndex, repeat, shuffle } = get();
    if (!queue.length) return;
    if (auto) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

    if (auto && repeat === "one") {
      loadIndex(currentIndex);
      return;
    }
    let nextIndex: number;
    if (shuffle && queue.length > 1) {
      do {
        nextIndex = Math.floor(Math.random() * queue.length);
      } while (nextIndex === currentIndex);
    } else {
      nextIndex = currentIndex + 1;
    }
    if (nextIndex >= queue.length) {
      if (repeat === "all") nextIndex = 0;
      else {
        player?.pause();
        set({ isPlaying: false });
        return;
      }
    }
    loadIndex(nextIndex);
  },

  prev: () => {
    const { currentIndex, position } = get();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (position > 3) {
      player?.seekTo(0);
      set({ position: 0 });
      return;
    }
    const prevIndex = currentIndex - 1;
    if (prevIndex < 0) {
      player?.seekTo(0);
      set({ position: 0 });
      return;
    }
    loadIndex(prevIndex);
  },

  seek: (seconds) => {
    player?.seekTo(seconds);
    set({ position: seconds });
  },

  setShuffle: (v) => {
    Haptics.selectionAsync().catch(() => {});
    set({ shuffle: v });
  },

  cycleRepeat: () => {
    Haptics.selectionAsync().catch(() => {});
    const order: RepeatMode[] = ["off", "all", "one"];
    const idx = order.indexOf(get().repeat);
    set({ repeat: order[(idx + 1) % order.length] });
  },

  playNext: (track) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
      () => {},
    );
    const { queue, currentIndex } = get();
    const copy = [...queue];
    copy.splice(currentIndex + 1, 0, track);
    set({ queue: copy });
  },

  addToQueue: (track) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
      () => {},
    );
    set({ queue: [...get().queue, track] });
  },

  removeFromQueue: (index) => {
    const { queue, currentIndex } = get();
    if (index === currentIndex) return;
    const copy = [...queue];
    copy.splice(index, 1);
    set({
      queue: copy,
      currentIndex: index < currentIndex ? currentIndex - 1 : currentIndex,
    });
  },

  reorderQueue: (from, to) => {
    const { queue, currentIndex } = get();
    const copy = [...queue];
    const [item] = copy.splice(from, 1);
    copy.splice(to, 0, item);
    let newIndex = currentIndex;
    if (from === currentIndex) newIndex = to;
    else if (from < currentIndex && to >= currentIndex) newIndex -= 1;
    else if (from > currentIndex && to <= currentIndex) newIndex += 1;
    set({ queue: copy, currentIndex: newIndex });
  },

  clearQueue: () => {
    const { queue, currentIndex } = get();
    const cur = queue[currentIndex];
    set({ queue: cur ? [cur] : [], currentIndex: cur ? 0 : -1 });
  },
}));

/* Sleep timer — lives outside the store so it survives navigation. */
let sleepHandle: ReturnType<typeof setTimeout> | null = null;

export const useSleepStore = create<{
  endsAt: number | null;
  setTimer: (minutes: number | "endOfTrack") => void;
  cancel: () => void;
}>((set) => ({
  endsAt: null,
  setTimer: (minutes) => {
    if (sleepHandle) clearTimeout(sleepHandle);
    if (minutes === "endOfTrack") {
      set({ endsAt: -1 });
      return;
    }
    const ms = minutes * 60000;
    set({ endsAt: Date.now() + ms });
    sleepHandle = setTimeout(() => {
      const st = useAudioStore.getState();
      if (st.isPlaying) st.toggle();
      set({ endsAt: null });
    }, ms);
  },
  cancel: () => {
    if (sleepHandle) clearTimeout(sleepHandle);
    sleepHandle = null;
    set({ endsAt: null });
  },
}));
