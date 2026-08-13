import { Text, TextProps, TextStyle } from "react-native";

import { useTheme } from "@/src/theme/ThemeProvider";

type Variant = "display" | "title" | "subtitle" | "body" | "label" | "caption";

const SIZES: Record<Variant, number> = {
  display: 30,
  title: 20,
  subtitle: 16,
  body: 14,
  label: 13,
  caption: 12,
};

interface Props extends TextProps {
  variant?: Variant;
  color?: string;
  muted?: boolean;
  center?: boolean;
  weight?: TextStyle["fontWeight"];
}

export function AppText({
  variant = "body",
  color,
  muted,
  center,
  weight,
  style,
  ...rest
}: Props) {
  const { colors, fonts } = useTheme();
  const isDisplay = variant === "display" || variant === "title";
  const resolved =
    color ?? (muted ? colors.onSurfaceTertiary : colors.onSurface);
  return (
    <Text
      {...rest}
      style={[
        {
          fontFamily: isDisplay ? fonts.display : fonts.text,
          fontSize: SIZES[variant],
          color: resolved,
          fontWeight: weight ?? (isDisplay ? "600" : "500"),
          textAlign: center ? "center" : "left",
          letterSpacing: isDisplay ? 0.2 : 0,
        },
        style,
      ]}
    />
  );
}
