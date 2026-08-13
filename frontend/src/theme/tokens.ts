// Design tokens for "Resonance" — Glass / Luxe personality.
// Amber/antique-gold accent. No blues/purples anywhere.

export const palette = {
  light: {
    surface: "#F7F7F9",
    onSurface: "#111114",
    surfaceSecondary: "#EAEAEF",
    onSurfaceSecondary: "#333338",
    surfaceTertiary: "#DFDFE6",
    onSurfaceTertiary: "#44444C",
    surfaceInverse: "#0D0D11",
    onSurfaceInverse: "#F7F7F9",
    brand: "#EAA33A",
    brandPrimary: "#D28E25",
    onBrandPrimary: "#FFFFFF",
    brandSecondary: "#F4C57C",
    onBrandSecondary: "#111114",
    brandTertiary: "#F9E0B6",
    onBrandTertiary: "#111114",
    success: "#4A7A59",
    onSuccess: "#FFFFFF",
    warning: "#B58231",
    onWarning: "#FFFFFF",
    error: "#9E3D35",
    onError: "#FFFFFF",
    border: "#D4D4DB",
    borderStrong: "#BDBDC5",
    divider: "#E1E1E7",
  },
  dark: {
    surface: "#0D0D11",
    onSurface: "#F7F7F9",
    surfaceSecondary: "#1A1A22",
    onSurfaceSecondary: "#D8D8DF",
    surfaceTertiary: "#252530",
    onSurfaceTertiary: "#BDBDC5",
    surfaceInverse: "#F7F7F9",
    onSurfaceInverse: "#111114",
    brand: "#EAA33A",
    brandPrimary: "#EAA33A",
    onBrandPrimary: "#111114",
    brandSecondary: "#C98622",
    onBrandSecondary: "#FFFFFF",
    brandTertiary: "#4A3512",
    onBrandTertiary: "#F9E0B6",
    success: "#4A7A59",
    onSuccess: "#E3F0E8",
    warning: "#B58231",
    onWarning: "#FDECC8",
    error: "#9E3D35",
    onError: "#F7D6D3",
    border: "#2A2A33",
    borderStrong: "#3E3E4C",
    divider: "#1F1F27",
  },
};

export type ThemeColors = typeof palette.dark;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  "2xl": 32,
  "3xl": 48,
};

export const radius = {
  sm: 6,
  md: 12,
  lg: 20,
  pill: 999,
};

export const fonts = {
  display: "Fraunces",
  text: "Manrope",
};

export const fontSize = {
  sm: 12,
  base: 14,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 30,
  "4xl": 38,
};
