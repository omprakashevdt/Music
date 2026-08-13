import { useRouter } from "expo-router";
import { Plus, Playlist as PlaylistIcon } from "phosphor-react-native";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@/src/components/AppText";
import { EmptyState } from "@/src/components/EmptyState";
import { GridCard } from "@/src/components/GridCard";
import { Button } from "@/src/components/Button";
import { CONTENT_BOTTOM } from "@/src/constants";
import { getPlaylists } from "@/src/db/repo";
import { useRepo } from "@/src/hooks/useRepo";
import { useTheme } from "@/src/theme/ThemeProvider";
import { Playlist } from "@/src/types";
import { pluralize } from "@/src/utils/format";
import { Dimensions } from "react-native";

const { width } = Dimensions.get("window");
const GRID = (width - 16 * 2 - 14) / 2;

export default function PlaylistsScreen() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data } = useRepo(() => getPlaylists(), [] as Playlist[]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <AppText variant="display">Playlists</AppText>
        <Pressable
          testID="new-playlist-btn"
          onPress={() => router.push("/playlist/edit/new")}
          style={[styles.add, { backgroundColor: colors.brand }]}
        >
          <Plus size={22} color={colors.onBrandPrimary} weight="bold" />
        </Pressable>
      </View>

      {data.length === 0 ? (
        <EmptyState
          icon={<PlaylistIcon size={40} color={colors.brand} weight="fill" />}
          title="No playlists yet"
          message="Create your first playlist and give it a custom cover."
          action={
            <Button
              testID="create-first-playlist"
              label="Create playlist"
              onPress={() => router.push("/playlist/edit/new")}
              icon={<Plus size={20} color={colors.onBrandPrimary} weight="bold" />}
            />
          }
        />
      ) : (
        <FlatList
          data={data}
          numColumns={2}
          keyExtractor={(p) => p.id}
          columnWrapperStyle={{ paddingHorizontal: spacing.lg, gap: 14 }}
          contentContainerStyle={{ paddingTop: 12, gap: 20, paddingBottom: CONTENT_BOTTOM }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <GridCard
              testID={`playlist-card-${item.id}`}
              title={item.name}
              subtitle={pluralize(item.trackCount ?? 0, "song")}
              artworkUri={item.coverImagePath ?? item.coverFromTrack ?? null}
              seed={item.id}
              size={GRID}
              onPress={() => router.push(`/playlist/${item.id}`)}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  add: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
});
