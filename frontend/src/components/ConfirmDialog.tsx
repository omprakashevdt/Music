import { Modal, Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/src/components/AppText";
import { useConfirmStore } from "@/src/store/confirmStore";
import { useTheme } from "@/src/theme/ThemeProvider";

export function ConfirmDialog() {
  const { colors, spacing } = useTheme();
  const options = useConfirmStore((s) => s.options);
  const close = useConfirmStore((s) => s.close);

  return (
    <Modal
      visible={!!options}
      transparent
      animationType="fade"
      onRequestClose={close}
    >
      <Pressable style={styles.backdrop} onPress={close}>
        <Pressable
          testID="confirm-dialog"
          style={[styles.card, { backgroundColor: colors.surfaceSecondary }]}
          onPress={() => {}}
        >
          <AppText variant="title">{options?.title}</AppText>
          <AppText variant="body" muted style={{ marginTop: spacing.sm, lineHeight: 20 }}>
            {options?.message}
          </AppText>
          <View style={styles.actions}>
            <Pressable
              testID="confirm-cancel"
              onPress={close}
              style={[styles.btn, { backgroundColor: colors.surfaceTertiary }]}
            >
              <AppText variant="subtitle" weight="600">Cancel</AppText>
            </Pressable>
            <Pressable
              testID="confirm-ok"
              onPress={() => {
                options?.onConfirm();
                close();
              }}
              style={[
                styles.btn,
                { backgroundColor: options?.destructive ? colors.error : colors.brand },
              ]}
            >
              <AppText
                variant="subtitle"
                weight="700"
                color={options?.destructive ? colors.onError : colors.onBrandPrimary}
              >
                {options?.confirmLabel ?? "Confirm"}
              </AppText>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  card: { width: "100%", borderRadius: 20, padding: 24 },
  actions: { flexDirection: "row", gap: 12, marginTop: 24 },
  btn: {
    flex: 1,
    height: 48,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
});
