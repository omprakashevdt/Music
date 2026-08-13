import { Pressable, StyleSheet, ViewStyle } from "react-native";

import { AppText } from "@/src/components/AppText";
import { useTheme } from "@/src/theme/ThemeProvider";

interface Props {
  label: string;
  onPress: () => void;
  variant?: "primary" | "ghost";
  icon?: React.ReactNode;
  style?: ViewStyle;
  testID?: string;
}

export function Button({
  label,
  onPress,
  variant = "primary",
  icon,
  style,
  testID,
}: Props) {
  const { colors } = useTheme();
  const primary = variant === "primary";
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        {
          backgroundColor: primary ? colors.brand : colors.surfaceSecondary,
          borderColor: primary ? colors.brand : colors.border,
          opacity: pressed ? 0.8 : 1,
        },
        style,
      ]}
    >
      {icon}
      <AppText
        variant="subtitle"
        weight="700"
        color={primary ? colors.onBrandPrimary : colors.onSurface}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 52,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 24,
  },
});
