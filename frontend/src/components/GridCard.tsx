import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/src/components/AppText";
import { Artwork } from "@/src/components/Artwork";
import { useTheme } from "@/src/theme/ThemeProvider";

interface Props {
  title: string;
  subtitle?: string;
  artworkUri: string | null;
  seed: string;
  size: number;
  circle?: boolean;
  onPress: () => void;
  testID?: string;
}

export function GridCard({
  title,
  subtitle,
  artworkUri,
  seed,
  size,
  circle,
  onPress,
  testID,
}: Props) {
  const { colors } = useTheme();
  const radius = circle ? size / 2 : 14;
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => ({ width: size, opacity: pressed ? 0.75 : 1 })}
    >
      <View style={{ width: size, height: size }}>
        <Artwork uri={artworkUri} seed={seed} size={size} radius={radius} />
        {!circle && (
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.55)"]}
            style={[StyleSheet.absoluteFill, { borderRadius: radius }]}
          />
        )}
      </View>
      <AppText
        variant="subtitle"
        numberOfLines={1}
        center={circle}
        style={{ marginTop: 8 }}
      >
        {title}
      </AppText>
      {!!subtitle && (
        <AppText variant="caption" muted numberOfLines={1} center={circle} style={{ marginTop: 2 }}>
          {subtitle}
        </AppText>
      )}
    </Pressable>
  );
}
