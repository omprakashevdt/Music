import { Heart, DotsThreeVertical } from "phosphor-react-native";
import { memo } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/src/components/AppText";
import { Artwork } from "@/src/components/Artwork";
import { useTheme } from "@/src/theme/ThemeProvider";
import { Track } from "@/src/types";
import { formatTime } from "@/src/utils/format";

interface Props {
  track: Track;
  index: number;
  isActive?: boolean;
  onPress: () => void;
  onOptions: () => void;
  showArtwork?: boolean;
  showIndex?: boolean;
}

function SongRowBase({
  track,
  index,
  isActive,
  onPress,
  onOptions,
  showArtwork = true,
  showIndex = false,
}: Props) {
  const { colors, spacing } = useTheme();
  return (
    <Pressable
      testID={`song-row-${track.id}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { paddingHorizontal: spacing.lg, opacity: pressed ? 0.6 : 1 },
      ]}
    >
      {showIndex && (
        <AppText
          variant="body"
          muted
          style={{ width: 26, textAlign: "center" }}
        >
          {index + 1}
        </AppText>
      )}
      {showArtwork && (
        <Artwork uri={track.artworkUri} seed={track.album} size={48} radius={8} />
      )}
      <View style={styles.meta}>
        <AppText
          variant="subtitle"
          numberOfLines={1}
          color={isActive ? colors.brand : colors.onSurface}
        >
          {track.title}
        </AppText>
        <AppText variant="caption" muted numberOfLines={1} style={{ marginTop: 2 }}>
          {track.artist}
          {track.album ? ` · ${track.album}` : ""}
        </AppText>
      </View>
      <View style={styles.right}>
        {track.isFavorite === 1 && (
          <Heart size={15} color={colors.brand} weight="fill" />
        )}
        <AppText variant="caption" muted>
          {formatTime(track.duration)}
        </AppText>
      </View>
      <Pressable
        testID={`song-options-${track.id}`}
        onPress={onOptions}
        hitSlop={10}
        style={{ paddingLeft: 6 }}
      >
        <DotsThreeVertical size={20} color={colors.onSurfaceTertiary} weight="bold" />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    gap: 12,
    minHeight: 64,
  },
  meta: { flex: 1, justifyContent: "center" },
  right: { flexDirection: "row", alignItems: "center", gap: 8 },
});

export const SongRow = memo(SongRowBase);
