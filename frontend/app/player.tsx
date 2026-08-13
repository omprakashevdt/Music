import Slider from "@react-native-community/slider";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  CaretDown,
  DotsThreeVertical,
  Heart,
  Moon,
  Pause,
  Play,
  Plus,
  Queue,
  Repeat,
  RepeatOnce,
  Shuffle,
  SkipBack,
  SkipForward,
} from "phosphor-react-native";
import { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@/src/components/AppText";
import { Artwork } from "@/src/components/Artwork";
import { useSheets } from "@/src/components/SheetProvider";
import { getTrackById, toggleFavorite } from "@/src/db/repo";
import { bumpLibrary, useLibraryStore } from "@/src/store/libraryStore";
import { useAudioStore, useSleepStore } from "@/src/store/playerStore";
import { toast } from "@/src/store/toastStore";
import { useTheme } from "@/src/theme/ThemeProvider";
import { gradientFor } from "@/src/utils/colors";
import { formatTime } from "@/src/utils/format";

const SLEEP_OPTIONS: (number | "endOfTrack")[] = [5, 10, 15, 30, 45, 60, "endOfTrack"];

export default function PlayerScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { openAddToPlaylist } = useSheets();

  const current = useAudioStore((s) => s.current);
  const isPlaying = useAudioStore((s) => s.isPlaying);
  const position = useAudioStore((s) => s.position);
  const duration = useAudioStore((s) => s.duration);
  const shuffle = useAudioStore((s) => s.shuffle);
  const repeat = useAudioStore((s) => s.repeat);
  const toggle = useAudioStore((s) => s.toggle);
  const next = useAudioStore((s) => s.next);
  const prev = useAudioStore((s) => s.prev);
  const seek = useAudioStore((s) => s.seek);
  const setShuffle = useAudioStore((s) => s.setShuffle);
  const cycleRepeat = useAudioStore((s) => s.cycleRepeat);
  const version = useLibraryStore((s) => s.version);

  const [seeking, setSeeking] = useState(false);
  const [seekVal, setSeekVal] = useState(0);
  const [isFav, setIsFav] = useState(false);
  const [sleepOpen, setSleepOpen] = useState(false);
  const sleepEndsAt = useSleepStore((s) => s.endsAt);
  const setSleep = useSleepStore((s) => s.setTimer);
  const cancelSleep = useSleepStore((s) => s.cancel);

  useEffect(() => {
    if (current) getTrackById(current.id).then((t) => setIsFav(!!t?.isFavorite));
  }, [current, version]);

  if (!current) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" }}>
        <AppText variant="body" muted>Nothing playing</AppText>
      </View>
    );
  }

  const [g1, g2] = gradientFor(current.album);
  const displayPos = seeking ? seekVal : position;

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      {/* Blurred artwork backdrop */}
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient colors={[g1, g2]} style={StyleSheet.absoluteFill} />
        {!!current.artworkUri && (
          <Image
            source={{ uri: current.artworkUri }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            blurRadius={80}
          />
        )}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? "rgba(13,13,17,0.78)" : "rgba(247,247,249,0.82)" }]} />
      </View>

      <View style={{ flex: 1, paddingTop: insets.top + 8, paddingHorizontal: 24, paddingBottom: insets.bottom + 16 }}>
        {/* Header */}
        <View style={styles.topBar}>
          <Pressable testID="player-close" onPress={() => router.back()} hitSlop={10}>
            <CaretDown size={26} color={colors.onSurface} weight="bold" />
          </Pressable>
          <AppText variant="label" muted>NOW PLAYING</AppText>
          <Pressable testID="player-options" onPress={() => openAddToPlaylist(current)} hitSlop={10}>
            <DotsThreeVertical size={24} color={colors.onSurface} weight="bold" />
          </Pressable>
        </View>

        {/* Artwork */}
        <View style={styles.artWrap}>
          <Artwork uri={current.artworkUri} seed={current.album} size={Math.min(340, 320)} radius={24} style={styles.artShadow} />
        </View>

        {/* Title + favorite */}
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <AppText variant="display" numberOfLines={2}>{current.title}</AppText>
            <AppText variant="subtitle" muted numberOfLines={1} style={{ marginTop: 4 }}>
              {current.artist} · {current.album}
            </AppText>
          </View>
          <Pressable
            testID="player-favorite"
            onPress={async () => {
              await toggleFavorite(current.id);
              setIsFav((v) => !v);
              bumpLibrary();
            }}
            hitSlop={10}
            style={styles.favBtn}
          >
            <Heart size={28} color={isFav ? colors.brand : colors.onSurface} weight={isFav ? "fill" : "regular"} />
          </Pressable>
        </View>

        {/* Seek */}
        <View style={{ marginTop: 20 }}>
          <Slider
            testID="player-seek"
            minimumValue={0}
            maximumValue={duration || 1}
            value={displayPos}
            onSlidingStart={() => setSeeking(true)}
            onValueChange={setSeekVal}
            onSlidingComplete={(v) => {
              seek(v);
              setSeeking(false);
            }}
            minimumTrackTintColor={colors.brand}
            maximumTrackTintColor={colors.border}
            thumbTintColor={colors.brand}
          />
          <View style={styles.times}>
            <AppText variant="caption" muted>{formatTime(displayPos)}</AppText>
            <AppText variant="caption" muted>{formatTime(duration)}</AppText>
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <Pressable testID="player-shuffle" onPress={() => setShuffle(!shuffle)} hitSlop={10}>
            <Shuffle size={24} color={shuffle ? colors.brand : colors.onSurfaceTertiary} weight={shuffle ? "bold" : "regular"} />
          </Pressable>
          <Pressable testID="player-prev" onPress={prev} hitSlop={10}>
            <SkipBack size={34} color={colors.onSurface} weight="fill" />
          </Pressable>
          <Pressable
            testID="player-toggle"
            onPress={toggle}
            style={[styles.playBtn, { backgroundColor: colors.brand }]}
          >
            {isPlaying ? (
              <Pause size={34} color={colors.onBrandPrimary} weight="fill" />
            ) : (
              <Play size={34} color={colors.onBrandPrimary} weight="fill" />
            )}
          </Pressable>
          <Pressable testID="player-next" onPress={() => next()} hitSlop={10}>
            <SkipForward size={34} color={colors.onSurface} weight="fill" />
          </Pressable>
          <Pressable testID="player-repeat" onPress={cycleRepeat} hitSlop={10}>
            {repeat === "one" ? (
              <RepeatOnce size={24} color={colors.brand} weight="bold" />
            ) : (
              <Repeat size={24} color={repeat === "all" ? colors.brand : colors.onSurfaceTertiary} weight={repeat === "all" ? "bold" : "regular"} />
            )}
          </Pressable>
        </View>

        {/* Bottom actions */}
        <View style={styles.bottomRow}>
          <Pressable testID="player-sleep" onPress={() => setSleepOpen(true)} style={styles.bottomBtn}>
            <Moon size={20} color={sleepEndsAt ? colors.brand : colors.onSurfaceSecondary} weight={sleepEndsAt ? "fill" : "regular"} />
            <AppText variant="caption" color={sleepEndsAt ? colors.brand : colors.onSurfaceSecondary}>
              {sleepEndsAt ? "Timer on" : "Sleep"}
            </AppText>
          </Pressable>
          <Pressable testID="player-add-playlist" onPress={() => openAddToPlaylist(current)} style={styles.bottomBtn}>
            <Plus size={20} color={colors.onSurfaceSecondary} />
            <AppText variant="caption" color={colors.onSurfaceSecondary}>Playlist</AppText>
          </Pressable>
          <Pressable testID="player-queue" onPress={() => router.push("/queue")} style={styles.bottomBtn}>
            <Queue size={20} color={colors.onSurfaceSecondary} />
            <AppText variant="caption" color={colors.onSurfaceSecondary}>Queue</AppText>
          </Pressable>
        </View>
      </View>

      {/* Sleep timer sheet */}
      <Modal visible={sleepOpen} transparent animationType="fade" onRequestClose={() => setSleepOpen(false)}>
        <Pressable style={styles.sleepBackdrop} onPress={() => setSleepOpen(false)}>
          <Pressable style={[styles.sleepCard, { backgroundColor: colors.surfaceSecondary }]} onPress={() => {}}>
            <AppText variant="title" style={{ marginBottom: 12 }}>Sleep timer</AppText>
            {SLEEP_OPTIONS.map((opt) => (
              <Pressable
                key={String(opt)}
                testID={`sleep-${opt}`}
                onPress={() => {
                  setSleep(opt);
                  setSleepOpen(false);
                  toast(opt === "endOfTrack" ? "Stops after this song" : `Sleeping in ${opt} min`);
                }}
                style={styles.sleepRow}
              >
                <AppText variant="subtitle">
                  {opt === "endOfTrack" ? "End of current song" : `${opt} minutes`}
                </AppText>
              </Pressable>
            ))}
            {sleepEndsAt && (
              <Pressable
                testID="sleep-cancel"
                onPress={() => { cancelSleep(); setSleepOpen(false); toast("Timer cancelled"); }}
                style={styles.sleepRow}
              >
                <AppText variant="subtitle" color={colors.error}>Turn off timer</AppText>
              </Pressable>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  artWrap: { alignItems: "center", justifyContent: "center", flex: 1, marginVertical: 12 },
  artShadow: {
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 16 },
    elevation: 16,
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  favBtn: { padding: 4 },
  times: { flexDirection: "row", justifyContent: "space-between", marginTop: -4 },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 24,
  },
  playBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomRow: { flexDirection: "row", justifyContent: "space-around", marginTop: 28 },
  bottomBtn: { alignItems: "center", gap: 4, padding: 8 },
  sleepBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  sleepCard: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  sleepRow: { paddingVertical: 14 },
});
