import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import { Pause, Play, SkipForward } from "phosphor-react-native";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@/src/components/AppText";
import { Artwork } from "@/src/components/Artwork";
import { useAudioStore } from "@/src/store/playerStore";
import { useTheme } from "@/src/theme/ThemeProvider";

export function MiniPlayer({ tabBarHeight }: { tabBarHeight: number }) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const current = useAudioStore((s) => s.current);
  const isPlaying = useAudioStore((s) => s.isPlaying);
  const position = useAudioStore((s) => s.position);
  const duration = useAudioStore((s) => s.duration);
  const toggle = useAudioStore((s) => s.toggle);
  const next = useAudioStore((s) => s.next);

  if (!current) return null;
  const progress = duration > 0 ? Math.min(1, position / duration) : 0;

  return (
    <View
      testID="mini-player"
      style={[styles.wrap, { bottom: tabBarHeight + insets.bottom + 6 }]}
    >
      <Pressable onPress={() => router.push("/player")}>
        <BlurView
          intensity={isDark ? 40 : 60}
          tint={isDark ? "dark" : "light"}
          style={[styles.blur, { borderColor: colors.border }]}
        >
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: colors.surfaceSecondary, opacity: 0.82, borderRadius: 16 },
            ]}
          />
          <View style={styles.content}>
            <Artwork uri={current.artworkUri} seed={current.album} size={44} radius={8} />
            <View style={styles.meta}>
              <AppText variant="subtitle" numberOfLines={1}>
                {current.title}
              </AppText>
              <AppText variant="caption" muted numberOfLines={1}>
                {current.artist}
              </AppText>
            </View>
            <Pressable testID="mini-toggle" onPress={toggle} hitSlop={10} style={styles.ctrl}>
              {isPlaying ? (
                <Pause size={24} color={colors.onSurface} weight="fill" />
              ) : (
                <Play size={24} color={colors.onSurface} weight="fill" />
              )}
            </Pressable>
            <Pressable testID="mini-next" onPress={() => next()} hitSlop={10} style={styles.ctrl}>
              <SkipForward size={22} color={colors.onSurface} weight="fill" />
            </Pressable>
          </View>
          <View style={[styles.track, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.fill,
                { width: `${progress * 100}%`, backgroundColor: colors.brand },
              ]}
            />
          </View>
        </BlurView>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: 12, right: 12 },
  blur: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  meta: { flex: 1 },
  ctrl: { padding: 4 },
  track: { height: 2, width: "100%" },
  fill: { height: 2 },
});
