import { MagnifyingGlass, X } from "phosphor-react-native";
import { useEffect, useRef, useState } from "react";
import {
  FlatList,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@/src/components/AppText";
import { EmptyState } from "@/src/components/EmptyState";
import { SongRow } from "@/src/components/SongRow";
import { useSheets } from "@/src/components/SheetProvider";
import { CONTENT_BOTTOM } from "@/src/constants";
import {
  addSearchHistory,
  clearSearchHistory,
  getSearchHistory,
  searchTracks,
} from "@/src/db/repo";
import { useAudioStore } from "@/src/store/playerStore";
import { useTheme } from "@/src/theme/ThemeProvider";
import { Track } from "@/src/types";

export default function SearchScreen() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Track[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const inputRef = useRef<TextInput>(null);
  const playQueue = useAudioStore((s) => s.playQueue);
  const current = useAudioStore((s) => s.current);
  const { openTrackOptions } = useSheets();

  useEffect(() => {
    getSearchHistory().then(setHistory);
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      return;
    }
    const t = setTimeout(() => {
      searchTracks(q).then(setResults);
    }, 220);
    return () => clearTimeout(t);
  }, [query]);

  const commit = (q: string) => {
    setQuery(q);
    addSearchHistory(q).then(() => getSearchHistory().then(setHistory));
  };

  const showHistory = query.trim().length === 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: spacing.lg }}>
        <AppText variant="display" style={{ marginBottom: spacing.md }}>
          Search
        </AppText>
        <View style={[styles.searchBar, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
          <MagnifyingGlass size={20} color={colors.onSurfaceTertiary} />
          <TextInput
            ref={inputRef}
            testID="search-input"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => query.trim() && commit(query.trim())}
            placeholder="Songs, artists, albums, genres…"
            placeholderTextColor={colors.onSurfaceTertiary}
            returnKeyType="search"
            style={[styles.input, { color: colors.onSurface }]}
          />
          {query.length > 0 && (
            <Pressable testID="search-clear" onPress={() => setQuery("")} hitSlop={8}>
              <X size={18} color={colors.onSurfaceTertiary} weight="bold" />
            </Pressable>
          )}
        </View>
      </View>

      {showHistory ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: CONTENT_BOTTOM }}
        >
          {history.length > 0 ? (
            <>
              <View style={styles.historyHead}>
                <AppText variant="label" muted>RECENT SEARCHES</AppText>
                <Pressable
                  testID="clear-history"
                  onPress={() => clearSearchHistory().then(() => setHistory([]))}
                  hitSlop={8}
                >
                  <AppText variant="label" color={colors.brand}>Clear</AppText>
                </Pressable>
              </View>
              <View style={styles.chips}>
                {history.map((h) => (
                  <Pressable
                    key={h}
                    testID={`history-${h}`}
                    onPress={() => commit(h)}
                    style={[styles.chip, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
                  >
                    <AppText variant="label">{h}</AppText>
                  </Pressable>
                ))}
              </View>
            </>
          ) : (
            <View style={{ marginTop: 60 }}>
              <EmptyState
                icon={<MagnifyingGlass size={40} color={colors.brand} weight="bold" />}
                title="Find your music"
                message="Search across songs, artists, albums, genres and folders — fully offline."
              />
            </View>
          )}
        </ScrollView>
      ) : results.length === 0 ? (
        <View style={{ marginTop: 60 }}>
          <EmptyState
            icon={<MagnifyingGlass size={40} color={colors.onSurfaceTertiary} />}
            title="No matches found"
            message={`Nothing matched "${query.trim()}". Try a different search.`}
          />
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(t) => t.id}
          keyboardShouldPersistTaps="handled"
          onScrollBeginDrag={Keyboard.dismiss}
          contentContainerStyle={{ paddingTop: 12, paddingBottom: CONTENT_BOTTOM }}
          renderItem={({ item, index }) => (
            <SongRow
              track={item}
              index={index}
              isActive={current?.id === item.id}
              onPress={() => {
                commit(query.trim());
                playQueue(results, index);
              }}
              onOptions={() => openTrackOptions(item)}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  input: { flex: 1, fontSize: 15, fontFamily: "Manrope" },
  historyHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    height: 36,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});
