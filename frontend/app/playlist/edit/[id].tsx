import { useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { CaretDown, Camera, Trash, X } from "phosphor-react-native";
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@/src/components/AppText";
import { Artwork } from "@/src/components/Artwork";
import { Button } from "@/src/components/Button";
import {
  createPlaylist,
  deletePlaylist,
  getPlaylist,
  getPlaylistTracks,
  removeTrackFromPlaylist,
  updatePlaylist,
} from "@/src/db/repo";
import { useRepo } from "@/src/hooks/useRepo";
import { confirm } from "@/src/store/confirmStore";
import { bumpLibrary } from "@/src/store/libraryStore";
import { toast } from "@/src/store/toastStore";
import { useTheme } from "@/src/theme/ThemeProvider";

const THEME_COLORS = ["#EAA33A", "#9E3D35", "#4A7A59", "#B58231", "#8A5A22", "#227A6E"];

export default function PlaylistEdit() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = String(id) === "new";
  const pid = String(id);
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [cover, setCover] = useState<string | null>(null);
  const [themeColor, setThemeColor] = useState(THEME_COLORS[0]);

  useEffect(() => {
    if (!isNew) {
      getPlaylist(pid).then((p) => {
        if (p) {
          setName(p.name);
          setDescription(p.description ?? "");
          setCover(p.coverImagePath ?? null);
          setThemeColor(p.themeColor ?? THEME_COLORS[0]);
        }
      });
    }
  }, [pid, isNew]);

  const { data: tracks } = useRepo(
    () => (isNew ? Promise.resolve([]) : getPlaylistTracks(pid)),
    [],
    [pid],
  );

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
      base64: true,
    });
    if (!res.canceled && res.assets[0]) {
      const a = res.assets[0];
      setCover(a.base64 ? `data:image/jpeg;base64,${a.base64}` : a.uri);
    }
  };

  const save = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast("Enter a playlist name");
      return;
    }
    if (isNew) {
      await createPlaylist(trimmed, description.trim() || null, cover, themeColor);
      toast("Playlist created");
    } else {
      await updatePlaylist(pid, {
        name: trimmed,
        description: description.trim() || null,
        coverImagePath: cover,
        themeColor,
      });
      toast("Playlist updated");
    }
    bumpLibrary();
    router.back();
  };

  const remove = async (trackId: string) => {
    await removeTrackFromPlaylist(pid, trackId);
    bumpLibrary();
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.surface }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable testID="pl-edit-close" onPress={() => router.back()} hitSlop={10}>
          <CaretDown size={26} color={colors.onSurface} weight="bold" />
        </Pressable>
        <AppText variant="title">{isNew ? "New playlist" : "Edit playlist"}</AppText>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: spacing.lg, paddingBottom: 60 }}>
        <View style={{ alignItems: "center", marginBottom: spacing.xl }}>
          <Pressable testID="pl-cover-pick" onPress={pickImage}>
            <Artwork uri={cover} seed={pid} size={160} radius={20} />
            <View style={[styles.camBadge, { backgroundColor: colors.brand }]}>
              <Camera size={18} color={colors.onBrandPrimary} weight="fill" />
            </View>
          </Pressable>
          <AppText variant="caption" muted style={{ marginTop: 10 }}>Tap to choose a cover from your gallery</AppText>
        </View>

        <AppText variant="label" muted style={{ marginBottom: 6 }}>NAME</AppText>
        <TextInput
          testID="pl-name"
          value={name}
          onChangeText={setName}
          placeholder="e.g. Late Night Drive"
          placeholderTextColor={colors.onSurfaceTertiary}
          style={[styles.input, { backgroundColor: colors.surfaceSecondary, color: colors.onSurface, borderColor: colors.border }]}
        />

        <AppText variant="label" muted style={{ marginTop: spacing.lg, marginBottom: 6 }}>DESCRIPTION</AppText>
        <TextInput
          testID="pl-desc"
          value={description}
          onChangeText={setDescription}
          placeholder="Optional note"
          placeholderTextColor={colors.onSurfaceTertiary}
          style={[styles.input, { backgroundColor: colors.surfaceSecondary, color: colors.onSurface, borderColor: colors.border }]}
        />

        <AppText variant="label" muted style={{ marginTop: spacing.lg, marginBottom: 10 }}>THEME COLOR</AppText>
        <View style={styles.colors}>
          {THEME_COLORS.map((c) => (
            <Pressable
              key={c}
              testID={`pl-color-${c}`}
              onPress={() => setThemeColor(c)}
              style={[
                styles.swatch,
                { backgroundColor: c, borderColor: themeColor === c ? colors.onSurface : "transparent" },
              ]}
            />
          ))}
        </View>

        <View style={{ marginTop: spacing.xl }}>
          <Button testID="pl-save" label={isNew ? "Create playlist" : "Save changes"} onPress={save} />
        </View>

        {!isNew && (
          <>
            {tracks.length > 0 && (
              <>
                <AppText variant="label" muted style={{ marginTop: spacing.xl, marginBottom: 6 }}>SONGS</AppText>
                {tracks.map((t) => (
                  <View key={t.id} style={styles.trackRow}>
                    <Artwork uri={t.artworkUri} seed={t.album} size={40} radius={6} />
                    <View style={{ flex: 1 }}>
                      <AppText variant="body" numberOfLines={1}>{t.title}</AppText>
                      <AppText variant="caption" muted numberOfLines={1}>{t.artist}</AppText>
                    </View>
                    <Pressable testID={`pl-remove-${t.id}`} onPress={() => remove(t.id)} hitSlop={8}>
                      <X size={18} color={colors.onSurfaceTertiary} weight="bold" />
                    </Pressable>
                  </View>
                ))}
              </>
            )}
            <Pressable
              testID="pl-delete"
              onPress={() =>
                confirm({
                  title: "Delete playlist?",
                  message: `"${name}" will be permanently removed. Songs stay in your library.`,
                  confirmLabel: "Delete",
                  destructive: true,
                  onConfirm: () => deletePlaylist(pid).then(() => { bumpLibrary(); router.back(); router.back(); toast("Playlist deleted"); }),
                })
              }
              style={[styles.deleteBtn, { borderColor: colors.error }]}
            >
              <Trash size={20} color={colors.error} />
              <AppText variant="subtitle" color={colors.error} weight="600">Delete playlist</AppText>
            </Pressable>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
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
  input: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: "Manrope",
  },
  camBadge: {
    position: "absolute",
    bottom: 6,
    right: 6,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  colors: { flexDirection: "row", gap: 12 },
  swatch: { width: 40, height: 40, borderRadius: 20, borderWidth: 3 },
  trackRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 52,
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 32,
  },
});
