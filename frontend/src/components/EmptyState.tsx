import { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/src/components/AppText";
import { useTheme } from "@/src/theme/ThemeProvider";

interface Props {
  icon: ReactNode;
  title: string;
  message: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, message, action }: Props) {
  const { colors, spacing } = useTheme();
  return (
    <View style={[styles.wrap, { padding: spacing["2xl"] }]}>
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: colors.surfaceSecondary },
        ]}
      >
        {icon}
      </View>
      <AppText variant="title" center style={{ marginTop: spacing.lg }}>
        {title}
      </AppText>
      <AppText
        variant="body"
        muted
        center
        style={{ marginTop: spacing.sm, lineHeight: 20 }}
      >
        {message}
      </AppText>
      {!!action && <View style={{ marginTop: spacing.xl }}>{action}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center", flex: 1 },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
  },
});
