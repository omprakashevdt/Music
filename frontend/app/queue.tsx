import { useRouter } from "expo-router";
import { CaretDown, FloppyDisk, Trash, X } from "phosphor-react-native";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@/src/components/AppText";
import { Artwork } from "@/src/components/Artwork";
import { addTrackToPlaylist, createPlaylist } from "@/src/db/repo";
import { bumpLibrary } from "@/src/store/libraryStore";
import { useAudioStore } from "@/src/store/playerStore";
import { toast } from "@/src/store/toastStore";
import { useTheme } from "@/src/theme/ThemeProvider";
import { formatTime } from "@/src/utils/format";

export default function QueueScreen() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queue = useAudioStore((s) => s.queue);
  const currentIndex = useAudioStore((s) => s.currentIndex);
  const playQueue = useAudioStore((s) => s.playQueue);
  const removeFromQueue = useAudioStore((s) => s.removeFromQueue);
  const clearQueue = useAudioStore((s) => s.clearQueue);

  const saveAsPlaylist = async () => {
    if (!queue.length) return;
    const name = `Queue · ${new Date().toLocaleDateString()}`;
    const id = await createPlaylist(name, "Saved from queue", null, colors.brand);
    for (const t of queue) await addTrackToPlaylist(id, t.id);
    bumpLibrary();
    toast("Saved as playlist");
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable testID="queue-close" onPress={() => router.back()} hitSlop={10}>
          <CaretDown size={26} color={colors.onSurface} weight="bold" />
        </Pressable>
        <AppText variant="title">Queue</AppText>
        <View style={{ flexDirection: "row", gap: 16 }}>
          <Pressable testID="queue-save" onPress={saveAsPlaylist} hitSlop={8}>
            <FloppyDisk size={22} color={colors.onSurface} />
          </Pressable>
          <Pressable testID="queue-clear" onPress={() => { clearQueue(); toast("Queue cleared"); }} hitSlop={8}>
            <Trash size={22} color={colors.onSurface} />
          </Pressable>
        </View>
      </View>

      <FlatList
        data={queue}
        keyExtractor={(t, i) => `${t.id}-${i}`}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40, paddingTop: 8 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => {
          const active = index === currentIndex;
          return (
            <View style={[styles.row, { paddingHorizontal: spacing.lg }]}>
              <Pressable
                testID={`queue-item-${index}`}
                onPress={() => playQueue(queue, index)}
                style={styles.rowMain}
              >
                <Artwork uri={item.artworkUri} seed={item.album} size={44} radius={8} />
                <View style={{ flex: 1 }}>
                  <AppText variant="subtitle" numberOfLines={1} color={active ? colors.brand : colors.onSurface}>
                    {item.title}
                  </AppText>
                  <AppText variant="caption" muted numberOfLines={1}>{item.artist}</AppText>
                </View>
                <AppText variant="caption" muted>{formatTime(item.duration)}</AppText>
              </Pressable>
              {!active && (
                <Pressable testID={`queue-remove-${index}`} onPress={() => removeFromQueue(index)} hitSlop={8} style={{ paddingLeft: 10 }}>
                  <X size={18} color={colors.onSurfaceTertiary} weight="bold" />
                </Pressable>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  row: { flexDirection: "row", alignItems: "center", minHeight: 60 },
  rowMain: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 },
});
