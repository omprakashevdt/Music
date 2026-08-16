import { useRouter } from "expo-router";
import {
  ArrowClockwise,
  CaretRight,
  CheckCircle,
  Broom,
  Trash,
  ShieldCheck,
  MusicNotes,
  Moon,
  DownloadSimple,
  Gear,
} from "phosphor-react-native";
import { useState } from "react";
import { ActivityIndicator, Linking, ScrollView, StyleSheet, Switch, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@/src/components/AppText";
import { ProgressBar } from "@/src/components/ProgressBar";
import { Segmented } from "@/src/components/Segmented";
import { CONTENT_BOTTOM } from "@/src/constants";
import {
  clearPlaybackHistory,
  clearSearchHistory,
  getLibraryStats,
  resetLibrary,
  restoreDemoLibrary,
} from "@/src/db/repo";
import { useRepo } from "@/src/hooks/useRepo";
import { useScannerStore } from "@/src/services/scanner";
import { confirm } from "@/src/store/confirmStore";
import { bumpLibrary } from "@/src/store/libraryStore";
import { useAudioStore } from "@/src/store/playerStore";
import { toast } from "@/src/store/toastStore";
import { useTheme } from "@/src/theme/ThemeProvider";
import { ThemeMode } from "@/src/types";
import { pluralize } from "@/src/utils/format";
import { Pressable } from "react-native";

const MODE_LABEL: Record<string, ThemeMode> = { Light: "light", Dark: "dark", System: "system" };
const LABEL_MODE: Record<ThemeMode, string> = { light: "Light", dark: "Dark", system: "System" };

export default function SettingsScreen() {
  const { colors, spacing, mode, setMode } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const shuffle = useAudioStore((s) => s.shuffle);
  const setShuffle = useAudioStore((s) => s.setShuffle);
  const repeat = useAudioStore((s) => s.repeat);
  const cycleRepeat = useAudioStore((s) => s.cycleRepeat);
  const scanMode = useScannerStore((s) => s.mode);
  const scanRun = useScannerStore((s) => s.run);
  const importFiles = useScannerStore((s) => s.importFiles);
  const processed = useScannerStore((s) => s.processed);
  const added = useScannerStore((s) => s.added);
  const total = useScannerStore((s) => s.total);
  const scanError = useScannerStore((s) => s.error);
  const blocked = useScannerStore((s) => s.blocked);
  const busy = scanMode !== "idle";

  const { data: stats } = useRepo(() => getLibraryStats(), { tracks: 0, albums: 0, artists: 0 });

  const restoreDemo = async () => {
    await restoreDemoLibrary();
    bumpLibrary();
    toast("Demo library restored");
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.surface }}
      contentContainerStyle={{ paddingBottom: CONTENT_BOTTOM }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: spacing.lg }}>
        <AppText variant="display">Settings</AppText>
      </View>

      <Section title="APPEARANCE">
        <View style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.sm }}>
          <View style={styles.rowFlat}>
            <Moon size={20} color={colors.brand} weight="fill" />
            <AppText variant="subtitle" style={{ flex: 1 }}>Theme</AppText>
          </View>
        </View>
        <Segmented
          options={["Light", "Dark", "System"]}
          value={LABEL_MODE[mode]}
          onChange={(v) => setMode(MODE_LABEL[v])}
          testIDPrefix="theme"
        />
      </Section>

      <Section title="PLAYBACK">
        <ToggleRow
          icon={<MusicNotes size={20} color={colors.brand} />}
          label="Shuffle by default"
          value={shuffle}
          onValueChange={setShuffle}
          testID="setting-shuffle"
        />
        <TapRow
          icon={<ArrowClockwise size={20} color={colors.brand} />}
          label="Repeat mode"
          value={repeat === "off" ? "Off" : repeat === "one" ? "One" : "All"}
          onPress={cycleRepeat}
          testID="setting-repeat"
        />
        <View style={[styles.row, { opacity: 0.5 }]}>
          <View style={styles.rowLeft}>
            <CheckCircle size={20} color={colors.onSurfaceTertiary} />
            <AppText variant="subtitle">Gapless playback</AppText>
          </View>
          <AppText variant="caption" muted>Unavailable</AppText>
        </View>
      </Section>

      <Section title="LIBRARY">
        <Pressable
          testID="scan-music"
          onPress={() => !busy && scanRun()}
          style={({ pressed }) => [styles.row, { opacity: pressed ? 0.6 : 1 }]}
        >
          <View style={styles.rowLeft}>
            <ArrowClockwise size={20} color={colors.brand} />
            <View style={{ flex: 1 }}>
              <AppText variant="subtitle">Scan device music</AppText>
              <AppText variant="caption" muted numberOfLines={2}>
                {scanMode === "scanning"
                  ? `Scanning… ${processed} checked, ${added} new`
                  : scanError
                    ? scanError
                    : "Find MP3/M4A/FLAC files already on your device"}
              </AppText>
            </View>
          </View>
          {scanMode === "scanning" ? (
            <ActivityIndicator color={colors.brand} />
          ) : (
            <CaretRight size={18} color={colors.onSurfaceTertiary} />
          )}
        </Pressable>

        {blocked && (
          <Pressable
            testID="open-settings"
            onPress={() => Linking.openSettings()}
            style={({ pressed }) => [styles.row, { opacity: pressed ? 0.6 : 1 }]}
          >
            <View style={styles.rowLeft}>
              <Gear size={20} color={colors.brand} />
              <AppText variant="subtitle" color={colors.brand}>Open Settings to allow music access</AppText>
            </View>
            <CaretRight size={18} color={colors.onSurfaceTertiary} />
          </Pressable>
        )}

        <Pressable
          testID="import-music"
          onPress={() => !busy && importFiles()}
          style={({ pressed }) => [styles.row, { opacity: pressed ? 0.6 : 1 }]}
        >
          <View style={styles.rowLeft}>
            <DownloadSimple size={20} color={colors.brand} />
            <View style={{ flex: 1 }}>
              <AppText variant="subtitle">Import songs manually</AppText>
              <AppText variant="caption" muted numberOfLines={2}>
                {scanMode === "importing"
                  ? `Importing ${processed}/${total}…`
                  : "Pick audio files from your phone or SD card"}
              </AppText>
            </View>
          </View>
          {scanMode === "importing" ? (
            <ActivityIndicator color={colors.brand} />
          ) : (
            <CaretRight size={18} color={colors.onSurfaceTertiary} />
          )}
        </Pressable>

        {busy && (
          <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
            <ProgressBar
              indeterminate={scanMode === "scanning" || total === 0}
              progress={total > 0 ? processed / total : 0}
            />
          </View>
        )}

        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <MusicNotes size={20} color={colors.brand} />
            <AppText variant="subtitle">Library</AppText>
          </View>
          <AppText variant="caption" muted>
            {pluralize(stats.tracks, "song")} · {pluralize(stats.albums, "album")}
          </AppText>
        </View>

        <TapRow
          icon={<ArrowClockwise size={20} color={colors.brand} />}
          label="Restore demo songs"
          value=""
          onPress={restoreDemo}
          testID="restore-demo"
        />
        <AppText variant="caption" muted style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.sm }}>
          Supported: MP3, M4A/AAC, FLAC, WAV, OGG (device dependent)
        </AppText>
      </Section>

      <Section title="DATA">
        <TapRow
          icon={<Broom size={20} color={colors.brand} />}
          label="Clear playback history"
          value=""
          onPress={() =>
            confirm({
              title: "Clear playback history?",
              message: "This resets play counts and recently played.",
              confirmLabel: "Clear",
              onConfirm: () => clearPlaybackHistory().then(() => { bumpLibrary(); toast("History cleared"); }),
            })
          }
          testID="clear-history"
        />
        <TapRow
          icon={<Broom size={20} color={colors.brand} />}
          label="Clear search history"
          value=""
          onPress={() => clearSearchHistory().then(() => toast("Search history cleared"))}
          testID="clear-search"
        />
        <TapRow
          icon={<Trash size={20} color={colors.error} />}
          label="Reset library"
          value=""
          destructive
          onPress={() =>
            confirm({
              title: "Reset library?",
              message: "This removes all songs and playlist links. You can restore demo songs afterwards.",
              confirmLabel: "Reset",
              destructive: true,
              onConfirm: () => resetLibrary().then(() => { bumpLibrary(); toast("Library reset"); }),
            })
          }
          testID="reset-library"
        />
      </Section>

      <View style={[styles.privacy, { borderColor: colors.divider }]}>
        <ShieldCheck size={18} color={colors.success} weight="fill" />
        <AppText variant="caption" muted style={{ flex: 1, lineHeight: 18 }}>
          100% offline. No accounts, no ads, no tracking, no cloud upload. Your music stays on your device.
        </AppText>
      </View>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { colors, spacing } = useTheme();
  return (
    <View style={{ marginTop: spacing.xl }}>
      <AppText variant="label" muted style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.xs }}>
        {title}
      </AppText>
      <View style={{ backgroundColor: colors.surfaceSecondary, marginHorizontal: 12, borderRadius: 16, overflow: "hidden" }}>
        {children}
      </View>
    </View>
  );
}

function ToggleRow({ icon, label, value, onValueChange, testID }: any) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        {icon}
        <AppText variant="subtitle">{label}</AppText>
      </View>
      <Switch
        testID={testID}
        value={value}
        onValueChange={onValueChange}
        trackColor={{ true: colors.brand, false: colors.borderStrong }}
        thumbColor="#fff"
      />
    </View>
  );
}

function TapRow({ icon, label, value, onPress, destructive, testID }: any) {
  const { colors } = useTheme();
  return (
    <Pressable testID={testID} onPress={onPress} style={({ pressed }) => [styles.row, { opacity: pressed ? 0.6 : 1 }]}>
      <View style={styles.rowLeft}>
        {icon}
        <AppText variant="subtitle" color={destructive ? colors.error : colors.onSurface}>
          {label}
        </AppText>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        {!!value && <AppText variant="caption" color={colors.brand}>{value}</AppText>}
        <CaretRight size={18} color={colors.onSurfaceTertiary} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 56,
  },
  rowFlat: { flexDirection: "row", alignItems: "center", gap: 14 },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 14, flex: 1 },
  privacy: {
    flexDirection: "row",
    gap: 10,
    marginHorizontal: 16,
    marginTop: 28,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
  },
});
