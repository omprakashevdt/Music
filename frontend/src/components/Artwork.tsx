import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { MusicNote } from "phosphor-react-native";
import { StyleSheet, View, ViewStyle } from "react-native";

import { gradientFor } from "@/src/utils/colors";

interface Props {
  uri: string | null | undefined;
  size: number;
  seed: string;
  radius?: number;
  style?: ViewStyle;
}

export function Artwork({ uri, size, seed, radius = 12, style }: Props) {
  const [c1, c2] = gradientFor(seed);
  return (
    <View
      style={[
        { width: size, height: size, borderRadius: radius, overflow: "hidden" },
        style,
      ]}
    >
      <LinearGradient
        colors={[c1, c2]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {!uri && (
        <View style={styles.center}>
          <MusicNote size={size * 0.34} color="rgba(255,255,255,0.55)" weight="fill" />
        </View>
      )}
      {!!uri && (
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={200}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
});
