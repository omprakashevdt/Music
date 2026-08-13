import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetTextInput,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import {
  Heart,
  MusicNotesPlus,
  PencilSimple,
  Playlist as PlaylistIcon,
  Plus,
  Queue,
  User,
  VinylRecord,
} from "phosphor-react-native";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@/src/components/AppText";
import { Artwork } from "@/src/components/Artwork";
import { ConfirmDialog } from "@/src/components/ConfirmDialog";
import {
  addTrackToPlaylist,
  createPlaylist,
  getPlaylists,
  toggleFavorite,
} from "@/src/db/repo";
import { bumpLibrary, useLibraryStore } from "@/src/store/libraryStore";
import { useAudioStore } from "@/src/store/playerStore";
import { toast, useToastStore } from "@/src/store/toastStore";
import { useTheme } from "@/src/theme/ThemeProvider";
import { Playlist, Track } from "@/src/types";

interface SheetCtx {
  openTrackOptions: (t: Track) => void;
  openAddToPlaylist: (t: Track) => void;
}

const Ctx = createContext<SheetCtx | null>(null);
export const useSheets = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useSheets outside provider");
  return c;
};

export function SheetProvider({ children }: { children: React.ReactNode }) {
  const { colors, spacing } = useTheme();
  const router = useRouter();
  const optionsRef = useRef<BottomSheetModal>(null);
  const playlistRef = useRef<BottomSheetModal>(null);
  const [track, setTrack] = useState<Track | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [newName, setNewName] = useState("");
  const playNext = useAudioStore((s) => s.playNext);
  const addToQueue = useAudioStore((s) => s.addToQueue);

  const backdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
      />
    ),
    [],
  );

  const openTrackOptions = useCallback((t: Track) => {
    setTrack(t);
    optionsRef.current?.present();
  }, []);

  const openAddToPlaylist = useCallback(async (t: Track) => {
    setTrack(t);
    setPlaylists(await getPlaylists());
    playlistRef.current?.present();
  }, []);

  const ctx = useMemo(
    () => ({ openTrackOptions, openAddToPlaylist }),
    [openTrackOptions, openAddToPlaylist],
  );

  const sheetBg = { backgroundColor: colors.surfaceSecondary };
  const handleStyle = { backgroundColor: colors.borderStrong };

  const optionRow = (
    icon: React.ReactNode,
    label: string,
    onPress: () => void,
    testID: string,
  ) => (
    <Pressable
      key={testID}
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => [styles.optRow, { opacity: pressed ? 0.6 : 1 }]}
    >
      {icon}
      <AppText variant="subtitle">{label}</AppText>
    </Pressable>
  );

  const closeThen = (fn: () => void) => {
    optionsRef.current?.dismiss();
    setTimeout(fn, 180);
  };

  return (
    <Ctx.Provider value={ctx}>
      {children}

      <BottomSheetModal
        ref={optionsRef}
        enableDynamicSizing
        backdropComponent={backdrop}
        backgroundStyle={sheetBg}
        handleIndicatorStyle={handleStyle}
      >
        <BottomSheetView style={{ paddingBottom: 32 }}>
          {track && (
            <View style={[styles.header, { borderBottomColor: colors.divider }]}>
              <Artwork uri={track.artworkUri} seed={track.album} size={48} radius={8} />
              <View style={{ flex: 1 }}>
                <AppText variant="subtitle" numberOfLines={1}>
                  {track.title}
                </AppText>
                <AppText variant="caption" muted numberOfLines={1}>
                  {track.artist}
                </AppText>
              </View>
            </View>
          )}
          {track &&
            optionRow(
              <Queue size={22} color={colors.onSurface} />,
              "Play next",
              () => {
                playNext(track);
                closeThen(() => toast("Playing next"));
              },
              "opt-play-next",
            )}
          {track &&
            optionRow(
              <MusicNotesPlus size={22} color={colors.onSurface} />,
              "Add to queue",
              () => {
                addToQueue(track);
                closeThen(() => toast("Added to queue"));
              },
              "opt-add-queue",
            )}
          {track &&
            optionRow(
              <PlaylistIcon size={22} color={colors.onSurface} />,
              "Add to playlist",
              () => closeThen(() => openAddToPlaylist(track)),
              "opt-add-playlist",
            )}
          {track &&
            optionRow(
              <Heart
                size={22}
                color={track.isFavorite ? colors.brand : colors.onSurface}
                weight={track.isFavorite ? "fill" : "regular"}
              />,
              track.isFavorite ? "Remove favorite" : "Add to favorites",
              async () => {
                await toggleFavorite(track.id);
                bumpLibrary();
                closeThen(() =>
                  toast(track.isFavorite ? "Removed from favorites" : "Added to favorites"),
                );
              },
              "opt-favorite",
            )}
          {track &&
            optionRow(
              <VinylRecord size={22} color={colors.onSurface} />,
              "Go to album",
              () => closeThen(() => router.push(`/album/${encodeURIComponent(track.album)}`)),
              "opt-go-album",
            )}
          {track &&
            optionRow(
              <User size={22} color={colors.onSurface} />,
              "Go to artist",
              () => closeThen(() => router.push(`/artist/${encodeURIComponent(track.artist)}`)),
              "opt-go-artist",
            )}
          {track &&
            optionRow(
              <PencilSimple size={22} color={colors.onSurface} />,
              "Edit info",
              () => closeThen(() => router.push(`/edit/${track.id}`)),
              "opt-edit",
            )}
        </BottomSheetView>
      </BottomSheetModal>

      <BottomSheetModal
        ref={playlistRef}
        enableDynamicSizing
        backdropComponent={backdrop}
        backgroundStyle={sheetBg}
        handleIndicatorStyle={handleStyle}
      >
        <BottomSheetView style={{ paddingBottom: 32, paddingHorizontal: spacing.lg }}>
          <AppText variant="title" style={{ marginBottom: spacing.md }}>
            Add to playlist
          </AppText>
          <View style={[styles.createRow, { borderColor: colors.border }]}>
            <BottomSheetTextInput
              testID="new-playlist-input"
              placeholder="New playlist name"
              placeholderTextColor={colors.onSurfaceTertiary}
              value={newName}
              onChangeText={setNewName}
              style={[styles.input, { color: colors.onSurface }]}
            />
            <Pressable
              testID="create-playlist-confirm"
              onPress={async () => {
                if (!newName.trim() || !track) return;
                const id = await createPlaylist(newName.trim(), null, null, colors.brand);
                await addTrackToPlaylist(id, track.id);
                setNewName("");
                bumpLibrary();
                playlistRef.current?.dismiss();
                toast("Playlist created");
              }}
              style={[styles.createBtn, { backgroundColor: colors.brand }]}
            >
              <Plus size={20} color={colors.onBrandPrimary} weight="bold" />
            </Pressable>
          </View>
          {playlists.map((p) =>
            optionRow(
              <Artwork uri={p.coverImagePath ?? p.coverFromTrack} seed={p.id} size={40} radius={6} />,
              p.name,
              async () => {
                if (!track) return;
                await addTrackToPlaylist(p.id, track.id);
                bumpLibrary();
                playlistRef.current?.dismiss();
                toast(`Added to ${p.name}`);
              },
              `add-to-${p.id}`,
            ),
          )}
          {playlists.length === 0 && (
            <AppText variant="body" muted style={{ paddingVertical: spacing.md }}>
              No playlists yet — create one above.
            </AppText>
          )}
        </BottomSheetView>
      </BottomSheetModal>

      <Toast />
      <ConfirmDialog />
    </Ctx.Provider>
  );
}

function Toast() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const message = useToastStore((s) => s.message);
  const version = useLibraryStore((s) => s.version); // keep provider re-rendering harmless
  if (!message) return null;
  return (
    <Animated.View
      entering={FadeInDown}
      exiting={FadeOutDown}
      pointerEvents="none"
      style={[
        styles.toast,
        { bottom: insets.bottom + 90, backgroundColor: colors.surfaceInverse },
      ]}
    >
      <AppText variant="label" color={colors.onSurfaceInverse} center>
        {message}
      </AppText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
    marginBottom: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  optRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  createRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 6,
    marginBottom: 12,
  },
  input: { flex: 1, fontSize: 15, paddingVertical: 8 },
  createBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  toast: {
    position: "absolute",
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
    maxWidth: "80%",
  },
});
