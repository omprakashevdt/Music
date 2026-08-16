import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { CaretLeft, Play, Shuffle } from "phosphor-react-native";
import { FlatList, Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@/src/components/AppText";
import { EmptyState } from "@/src/components/EmptyState";
import { SongRow } from "@/src/components/SongRow";
import { useSheets } from "@/src/components/SheetProvider";
import { CONTENT_BOTTOM } from "@/src/constants";
import { useAudioStore } from "@/src/store/playerStore";
import { useTheme } from "@/src/theme/ThemeProvider";
import { Track } from "@/src/types";
import { gradientFor } from "@/src/utils/colors";
import { pluralize } from "@/src/utils/format";

interface Props {
  title: string;
  subtitle: string;
  artworkUri: string | null;
  seed: string;
  tracks: Track[];
  circle?: boolean;
  showTrackArtwork?: boolean;
  headerRight?: React.ReactNode;
  emptyMessage?: string;
}

export function CollectionView({
  title,
  subtitle,
  artworkUri,
  seed,
  tracks,
  circle,
  showTrackArtwork = true,
  headerRight,
  emptyMessage,
}: Props) {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const playQueue = useAudioStore((s) => s.playQueue);
  const setShuffle = useAudioStore((s) => s.setShuffle);
  const current = useAudioStore((s) => s.current);
  const { openTrackOptions } = useSheets();
  const [g1, g2] = gradientFor(seed);
  const { width } = useWindowDimensions();
  const bannerH = Math.min(Math.round(width * 0.92), 380);

  const play = () => {
    if (!tracks.length) return;
    setShuffle(false);
    playQueue(tracks, 0);
    router.push("/player");
  };
  const shuffle = () => {
    if (!tracks.length) return;
    setShuffle(true);
    playQueue(tracks, Math.floor(Math.random() * tracks.length));
    router.push("/player");
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <Pressable
        testID="collection-back"
        onPress={() => router.back()}
        style={[styles.back, { top: insets.top + 8, backgroundColor: colors.surfaceSecondary }]}
        hitSlop={8}
      >
        <CaretLeft size={22} color={colors.onSurface} weight="bold" />
      </Pressable>
      {headerRight && (
        <View style={[styles.headerRight, { top: insets.top + 8 }]}>{headerRight}</View>
      )}

      <FlatList
        data={tracks}
        keyExtractor={(t) => t.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: CONTENT_BOTTOM }}
        ListHeaderComponent={
          <View>
            <View style={[styles.banner, { height: bannerH }]}>
              {artworkUri ? (
                <Image
                  source={{ uri: artworkUri }}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  transition={200}
                />
              ) : (
                <LinearGradient colors={[g1, g2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
              )}
              {/* Scrim: darker at top for controls, strong at bottom for text legibility */}
              <LinearGradient
                colors={["rgba(0,0,0,0.35)", "rgba(0,0,0,0)", "rgba(0,0,0,0.30)", "rgba(0,0,0,0.85)"]}
                locations={[0, 0.28, 0.6, 1]}
                style={StyleSheet.absoluteFill}
              />
              <View style={[styles.bannerText, { paddingHorizontal: spacing.lg }]}>
                <AppText variant="display" numberOfLines={2} color="#FFFFFF" style={styles.shadow}>
                  {title}
                </AppText>
                {!!subtitle && (
                  <AppText variant="subtitle" numberOfLines={1} color="rgba(255,255,255,0.92)" style={[styles.shadow, { marginTop: 4 }]}>
                    {subtitle}
                  </AppText>
                )}
                <AppText variant="caption" numberOfLines={1} color="rgba(255,255,255,0.78)" style={[styles.shadow, { marginTop: 2 }]}>
                  {pluralize(tracks.length, "song")}
                </AppText>
              </View>
            </View>
            <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.lg }}>
              <View style={styles.actions}>
                <Pressable testID="collection-play" onPress={play} style={[styles.playBtn, { backgroundColor: colors.brand }]}>
                  <Play size={20} color={colors.onBrandPrimary} weight="fill" />
                  <AppText variant="subtitle" weight="700" color={colors.onBrandPrimary}>Play</AppText>
                </Pressable>
                <Pressable testID="collection-shuffle" onPress={shuffle} style={[styles.shuffleBtn, { borderColor: colors.border, backgroundColor: colors.surfaceSecondary }]}>
                  <Shuffle size={20} color={colors.onSurface} weight="bold" />
                  <AppText variant="subtitle" weight="600">Shuffle</AppText>
                </Pressable>
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={{ paddingTop: 40 }}>
            <EmptyState
              icon={<Play size={36} color={colors.brand} weight="fill" />}
              title="No songs"
              message={emptyMessage ?? "This collection is empty."}
            />
          </View>
        }
        renderItem={({ item, index }) => (
          <SongRow
            track={item}
            index={index}
            isActive={current?.id === item.id}
            showArtwork={showTrackArtwork}
            showIndex={!showTrackArtwork}
            onPress={() => { playQueue(tracks, index); }}
            onOptions={() => openTrackOptions(item)}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  back: {
    position: "absolute",
    left: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerRight: { position: "absolute", right: 16, zIndex: 10 },
  banner: { width: "100%", justifyContent: "flex-end", overflow: "hidden" },
  bannerText: { position: "absolute", left: 0, right: 0, bottom: 0, paddingBottom: 18 },
  shadow: {
    textShadowColor: "rgba(0,0,0,0.65)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  actions: { flexDirection: "row", gap: 12, marginTop: 4 },
  playBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 50,
    borderRadius: 999,
    paddingHorizontal: 28,
  },
  shuffleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 50,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 24,
  },
});
