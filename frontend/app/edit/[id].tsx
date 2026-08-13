import { useLocalSearchParams, useRouter } from "expo-router";
import { CaretDown } from "phosphor-react-native";
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
import { getTrackById, updateTrackMeta } from "@/src/db/repo";
import { bumpLibrary } from "@/src/store/libraryStore";
import { toast } from "@/src/store/toastStore";
import { useTheme } from "@/src/theme/ThemeProvider";
import { Track } from "@/src/types";

export default function EditTrack() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [track, setTrack] = useState<Track | null>(null);
  const [form, setForm] = useState({ title: "", artist: "", album: "", genre: "", year: "" });

  useEffect(() => {
    getTrackById(String(id)).then((t) => {
      if (t) {
        setTrack(t);
        setForm({
          title: t.title,
          artist: t.artist,
          album: t.album,
          genre: t.genre,
          year: t.year ? String(t.year) : "",
        });
      }
    });
  }, [id]);

  const save = async () => {
    if (!track) return;
    await updateTrackMeta(track.id, {
      title: form.title.trim() || track.title,
      artist: form.artist.trim() || "Unknown Artist",
      album: form.album.trim() || "Unknown Album",
      genre: form.genre.trim() || "Unknown",
      year: form.year ? Number(form.year) : null,
    });
    bumpLibrary();
    toast("Details saved");
    router.back();
  };

  const field = (label: string, key: keyof typeof form, keyboard?: "numeric") => (
    <View style={{ marginBottom: spacing.lg }}>
      <AppText variant="label" muted style={{ marginBottom: 6 }}>{label}</AppText>
      <TextInput
        testID={`edit-${key}`}
        value={form[key]}
        onChangeText={(v) => setForm((f) => ({ ...f, [key]: v }))}
        keyboardType={keyboard}
        placeholderTextColor={colors.onSurfaceTertiary}
        style={[styles.input, { backgroundColor: colors.surfaceSecondary, color: colors.onSurface, borderColor: colors.border }]}
      />
    </View>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.surface }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable testID="edit-close" onPress={() => router.back()} hitSlop={10}>
          <CaretDown size={26} color={colors.onSurface} weight="bold" />
        </Pressable>
        <AppText variant="title">Edit info</AppText>
        <View style={{ width: 26 }} />
      </View>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: spacing.lg, paddingBottom: 60 }}>
        {track && (
          <View style={{ alignItems: "center", marginBottom: spacing.xl }}>
            <Artwork uri={track.artworkUri} seed={track.album} size={140} radius={16} />
          </View>
        )}
        {field("Title", "title")}
        {field("Artist", "artist")}
        {field("Album", "album")}
        {field("Genre", "genre")}
        {field("Year", "year", "numeric")}
        <Button testID="edit-save" label="Save changes" onPress={save} />
        <AppText variant="caption" muted center style={{ marginTop: spacing.lg, lineHeight: 18 }}>
          Changes are saved in the app library only. The original audio file is never modified.
        </AppText>
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
});
