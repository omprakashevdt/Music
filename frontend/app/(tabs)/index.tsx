import { useRouter } from "expo-router";
import { Heart } from "phosphor-react-native";
import { FlatList, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@/src/components/AppText";
import { GridCard } from "@/src/components/GridCard";
import { TrackCard } from "@/src/components/TrackCard";
import { CONTENT_BOTTOM } from "@/src/constants";
import {
  getFavorites,
  getMostPlayed,
  getPlaylists,
  getRecentlyAdded,
  getRecentlyPlayed,
} from "@/src/db/repo";
import { useRepo } from "@/src/hooks/useRepo";
import { useAudioStore } from "@/src/store/playerStore";
import { useTheme } from "@/src/theme/ThemeProvider";
import { Playlist, Track } from "@/src/types";
import { pluralize } from "@/src/utils/format";

const QUICK = ["Songs", "Artists", "Albums", "Genres", "Years", "Folders"];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function HomeScreen() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const playQueue = useAudioStore((s) => s.playQueue);

  const { data } = useRepo(
    async () => ({
      recent: await getRecentlyPlayed(10),
      most: await getMostPlayed(10),
      added: await getRecentlyAdded(12),
      playlists: await getPlaylists(),
      favorites: await getFavorites(),
    }),
    {
      recent: [] as Track[],
      most: [] as Track[],
      added: [] as Track[],
      playlists: [] as Playlist[],
      favorites: [] as Track[],
    },
  );

  const play = (list: Track[], index: number) => {
    playQueue(list, index);
    router.push("/player");
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={{ flex: 1 }}>
          <AppText variant="caption" muted>
            {greeting()}
          </AppText>
          <AppText variant="display" style={{ marginTop: 2 }}>
            Resonance
          </AppText>
        </View>
        <Pressable
          testID="home-favorites"
          onPress={() => router.push("/(tabs)/library?tab=Favorites")}
          style={[styles.iconBtn, { backgroundColor: colors.surfaceSecondary }]}
        >
          <Heart size={20} color={colors.brand} weight="fill" />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: CONTENT_BOTTOM }}
      >
        {/* Quick access chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingHorizontal: spacing.lg, paddingVertical: spacing.md }}
        >
          {QUICK.map((q) => (
            <Pressable
              key={q}
              testID={`quick-${q.toLowerCase()}`}
              onPress={() => router.push(`/(tabs)/library?tab=${q}`)}
              style={[styles.quick, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
            >
              <AppText variant="label">{q}</AppText>
            </Pressable>
          ))}
        </ScrollView>

        {data.recent.length > 0 && (
          <Section title="Recently played">
            <Carousel
              data={data.recent}
              onPress={(i) => play(data.recent, i)}
            />
          </Section>
        )}

        {data.most.length > 0 && (
          <Section title="Most played">
            <Carousel data={data.most} onPress={(i) => play(data.most, i)} />
          </Section>
        )}

        {data.playlists.length > 0 && (
          <Section title="Your playlists" onSeeAll={() => router.push("/(tabs)/playlists")}>
            <FlatList
              horizontal
              data={data.playlists}
              keyExtractor={(p) => p.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 14, paddingHorizontal: spacing.lg }}
              renderItem={({ item }) => (
                <GridCard
                  testID={`home-playlist-${item.id}`}
                  title={item.name}
                  subtitle={pluralize(item.trackCount ?? 0, "song")}
                  artworkUri={item.coverImagePath ?? item.coverFromTrack ?? null}
                  seed={item.id}
                  size={150}
                  onPress={() => router.push(`/playlist/${item.id}`)}
                />
              )}
            />
          </Section>
        )}

        {data.added.length > 0 && (
          <Section title="Recently added">
            <Carousel data={data.added} onPress={(i) => play(data.added, i)} />
          </Section>
        )}
      </ScrollView>
    </View>
  );
}

function Section({
  title,
  onSeeAll,
  children,
}: {
  title: string;
  onSeeAll?: () => void;
  children: React.ReactNode;
}) {
  const { colors, spacing } = useTheme();
  return (
    <View style={{ marginTop: spacing.lg }}>
      <View style={[styles.sectionHead, { paddingHorizontal: spacing.lg }]}>
        <AppText variant="title">{title}</AppText>
        {onSeeAll && (
          <Pressable onPress={onSeeAll} hitSlop={8}>
            <AppText variant="label" color={colors.brand}>
              See all
            </AppText>
          </Pressable>
        )}
      </View>
      <View style={{ marginTop: spacing.md }}>{children}</View>
    </View>
  );
}

function Carousel({ data, onPress }: { data: Track[]; onPress: (i: number) => void }) {
  const { spacing } = useTheme();
  return (
    <FlatList
      horizontal
      data={data}
      keyExtractor={(t) => t.id}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 14, paddingHorizontal: spacing.lg }}
      renderItem={({ item, index }) => (
        <TrackCard track={item} onPress={() => onPress(index)} />
      )}
    />
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  quick: {
    height: 40,
    flexShrink: 0,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
