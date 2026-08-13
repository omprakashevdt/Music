import { useLocalSearchParams, useRouter } from "expo-router";
import { Heart, MusicNotes } from "phosphor-react-native";
import { useState } from "react";
import { Dimensions, FlatList, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@/src/components/AppText";
import { Artwork } from "@/src/components/Artwork";
import { EmptyState } from "@/src/components/EmptyState";
import { GridCard } from "@/src/components/GridCard";
import { Segmented } from "@/src/components/Segmented";
import { SongRow } from "@/src/components/SongRow";
import { useSheets } from "@/src/components/SheetProvider";
import { CONTENT_BOTTOM } from "@/src/constants";
import {
  getAlbums,
  getAllTracks,
  getArtists,
  getFavorites,
  getFolders,
  getGenres,
  getTracksByFolder,
  getTracksByGenre,
  getYears,
} from "@/src/db/repo";
import { useRepo } from "@/src/hooks/useRepo";
import { useAudioStore } from "@/src/store/playerStore";
import { useTheme } from "@/src/theme/ThemeProvider";
import { SongSort, Track } from "@/src/types";
import { decadeLabel, pluralize } from "@/src/utils/format";

const TABS = ["Songs", "Artists", "Albums", "Genres", "Years", "Folders", "Favorites"];
const { width } = Dimensions.get("window");
const GRID = (width - 16 * 2 - 14) / 2;

export default function LibraryScreen() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState(
    params.tab && TABS.includes(params.tab) ? params.tab : "Songs",
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={{ paddingTop: insets.top + 8 }}>
        <AppText variant="display" style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.md }}>
          Library
        </AppText>
        <Segmented options={TABS} value={tab} onChange={setTab} testIDPrefix="lib-tab" />
      </View>
      <View style={{ flex: 1 }}>
        {tab === "Songs" && <SongsList />}
        {tab === "Artists" && <ArtistsList />}
        {tab === "Albums" && <AlbumsList />}
        {tab === "Genres" && <GenresList />}
        {tab === "Years" && <YearsList />}
        {tab === "Folders" && <FoldersList />}
        {tab === "Favorites" && <FavoritesList />}
      </View>
    </View>
  );
}

const SORTS: { key: SongSort; label: string }[] = [
  { key: "title", label: "Title" },
  { key: "artist", label: "Artist" },
  { key: "album", label: "Album" },
  { key: "dateAdded", label: "Recent" },
  { key: "playCount", label: "Most played" },
  { key: "year", label: "Year" },
];

function SongsList() {
  const { colors, spacing } = useTheme();
  const [sort, setSort] = useState<SongSort>("title");
  const { data } = useRepo(() => getAllTracks(sort), [] as Track[], [sort]);
  const playQueue = useAudioStore((s) => s.playQueue);
  const current = useAudioStore((s) => s.current);
  const { openTrackOptions } = useSheets();

  if (data.length === 0) return <MusicEmpty />;

  return (
    <FlatList
      data={data}
      keyExtractor={(t) => t.id}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: CONTENT_BOTTOM }}
      ListHeaderComponent={
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm }}
        >
          {SORTS.map((s) => {
            const active = s.key === sort;
            return (
              <Pressable
                key={s.key}
                testID={`sort-${s.key}`}
                onPress={() => setSort(s.key)}
                style={[styles.sortChip, { backgroundColor: active ? colors.brandTertiary : colors.surfaceSecondary, borderColor: active ? colors.brand : colors.border }]}
              >
                <AppText variant="caption" color={active ? colors.brand : colors.onSurfaceSecondary}>
                  {s.label}
                </AppText>
              </Pressable>
            );
          })}
        </ScrollView>
      }
      renderItem={({ item, index }) => (
        <SongRow
          track={item}
          index={index}
          isActive={current?.id === item.id}
          onPress={() => playQueue(data, index)}
          onOptions={() => openTrackOptions(item)}
        />
      )}
    />
  );
}

function FavoritesList() {
  const { openTrackOptions } = useSheets();
  const { data } = useRepo(() => getFavorites(), [] as Track[]);
  const playQueue = useAudioStore((s) => s.playQueue);
  const current = useAudioStore((s) => s.current);
  const { colors } = useTheme();
  if (data.length === 0)
    return (
      <EmptyState
        icon={<Heart size={40} color={colors.brand} weight="fill" />}
        title="No favorites yet"
        message="Tap the heart on any song to keep it here."
      />
    );
  return (
    <FlatList
      data={data}
      keyExtractor={(t) => t.id}
      contentContainerStyle={{ paddingTop: 8, paddingBottom: CONTENT_BOTTOM }}
      showsVerticalScrollIndicator={false}
      renderItem={({ item, index }) => (
        <SongRow
          track={item}
          index={index}
          isActive={current?.id === item.id}
          onPress={() => playQueue(data, index)}
          onOptions={() => openTrackOptions(item)}
        />
      )}
    />
  );
}

function ArtistsList() {
  const router = useRouter();
  const { data } = useRepo(() => getArtists(), []);
  const { colors, spacing } = useTheme();
  if (data.length === 0) return <MusicEmpty />;
  return (
    <FlatList
      data={data}
      keyExtractor={(a) => a.name}
      contentContainerStyle={{ paddingTop: 8, paddingBottom: CONTENT_BOTTOM }}
      showsVerticalScrollIndicator={false}
      renderItem={({ item }) => (
        <Pressable
          testID={`artist-${item.name}`}
          onPress={() => router.push(`/artist/${encodeURIComponent(item.name)}`)}
          style={({ pressed }) => [styles.rowItem, { paddingHorizontal: spacing.lg, opacity: pressed ? 0.6 : 1 }]}
        >
          <Artwork uri={item.artworkUri} seed={item.name} size={52} radius={26} />
          <View style={{ flex: 1 }}>
            <AppText variant="subtitle" numberOfLines={1}>{item.name}</AppText>
            <AppText variant="caption" muted>
              {pluralize(item.trackCount, "song")} · {pluralize(item.albumCount, "album")}
            </AppText>
          </View>
        </Pressable>
      )}
    />
  );
}

function AlbumsList() {
  const router = useRouter();
  const { data } = useRepo(() => getAlbums(), []);
  const { spacing } = useTheme();
  if (data.length === 0) return <MusicEmpty />;
  return (
    <FlatList
      data={data}
      numColumns={2}
      keyExtractor={(a) => `${a.name}-${a.artist}`}
      columnWrapperStyle={{ paddingHorizontal: spacing.lg, gap: 14 }}
      contentContainerStyle={{ paddingTop: 12, gap: 20, paddingBottom: CONTENT_BOTTOM }}
      showsVerticalScrollIndicator={false}
      renderItem={({ item }) => (
        <GridCard
          testID={`album-${item.name}`}
          title={item.name}
          subtitle={item.artist}
          artworkUri={item.artworkUri}
          seed={item.name}
          size={GRID}
          onPress={() => router.push(`/album/${encodeURIComponent(item.name)}`)}
        />
      )}
    />
  );
}

function GenresList() {
  const router = useRouter();
  const { data } = useRepo(() => getGenres(), []);
  const { colors, spacing } = useTheme();
  if (data.length === 0) return <MusicEmpty />;
  return (
    <FlatList
      data={data}
      keyExtractor={(g) => g.name}
      contentContainerStyle={{ paddingTop: 8, paddingBottom: CONTENT_BOTTOM }}
      showsVerticalScrollIndicator={false}
      renderItem={({ item }) => (
        <Pressable
          testID={`genre-${item.name}`}
          onPress={() => router.push(`/genre/${encodeURIComponent(item.name)}`)}
          style={({ pressed }) => [styles.rowItem, { paddingHorizontal: spacing.lg, opacity: pressed ? 0.6 : 1 }]}
        >
          <Artwork uri={item.artworkUri} seed={item.name} size={52} radius={12} />
          <View style={{ flex: 1 }}>
            <AppText variant="subtitle">{item.name}</AppText>
            <AppText variant="caption" muted>{pluralize(item.trackCount, "song")}</AppText>
          </View>
        </Pressable>
      )}
    />
  );
}

function YearsList() {
  const router = useRouter();
  const { data } = useRepo(() => getYears(), []);
  const { colors, spacing } = useTheme();
  if (data.length === 0) return <MusicEmpty />;
  return (
    <FlatList
      data={data}
      keyExtractor={(y) => String(y.year)}
      contentContainerStyle={{ paddingTop: 8, paddingBottom: CONTENT_BOTTOM }}
      showsVerticalScrollIndicator={false}
      renderItem={({ item }) => (
        <Pressable
          testID={`year-${item.year}`}
          onPress={() => router.push(`/year/${item.year}`)}
          style={({ pressed }) => [styles.rowItem, { paddingHorizontal: spacing.lg, opacity: pressed ? 0.6 : 1 }]}
        >
          <View style={[styles.yearBadge, { backgroundColor: colors.surfaceSecondary }]}>
            <AppText variant="label" color={colors.brand}>{decadeLabel(item.year)}</AppText>
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="subtitle">{item.year}</AppText>
            <AppText variant="caption" muted>{pluralize(item.trackCount, "song")}</AppText>
          </View>
        </Pressable>
      )}
    />
  );
}

function FoldersList() {
  const router = useRouter();
  const { data } = useRepo(() => getFolders(), []);
  const { colors, spacing } = useTheme();
  if (data.length === 0) return <MusicEmpty />;
  return (
    <FlatList
      data={data}
      keyExtractor={(f) => f.name}
      contentContainerStyle={{ paddingTop: 8, paddingBottom: CONTENT_BOTTOM }}
      showsVerticalScrollIndicator={false}
      renderItem={({ item }) => (
        <Pressable
          testID={`folder-${item.name}`}
          onPress={() => router.push(`/folder/${encodeURIComponent(item.name)}`)}
          style={({ pressed }) => [styles.rowItem, { paddingHorizontal: spacing.lg, opacity: pressed ? 0.6 : 1 }]}
        >
          <View style={[styles.yearBadge, { backgroundColor: colors.surfaceSecondary }]}>
            <MusicNotes size={22} color={colors.brand} />
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="subtitle" numberOfLines={1}>{item.name}</AppText>
            <AppText variant="caption" muted>{pluralize(item.trackCount, "song")}</AppText>
          </View>
        </Pressable>
      )}
    />
  );
}

function MusicEmpty() {
  const { colors } = useTheme();
  return (
    <EmptyState
      icon={<MusicNotes size={40} color={colors.brand} weight="fill" />}
      title="No music found"
      message="Go to Settings → Scan Music to import songs from your device."
    />
  );
}

const styles = StyleSheet.create({
  rowItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 8,
    minHeight: 68,
  },
  sortChip: {
    height: 34,
    flexShrink: 0,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  yearBadge: {
    width: 52,
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
