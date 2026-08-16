import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { useTheme } from "@/src/theme/ThemeProvider";

interface Props {
  indeterminate?: boolean;
  progress?: number; // 0..1
}

export function ProgressBar({ indeterminate, progress = 0 }: Props) {
  const { colors } = useTheme();
  const x = useSharedValue(0);

  useEffect(() => {
    if (indeterminate) {
      x.value = 0;
      x.value = withRepeat(
        withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
        -1,
        false,
      );
    } else {
      cancelAnimation(x);
    }
    return () => cancelAnimation(x);
  }, [indeterminate, x]);

  const indStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: (x.value - 0.35) * 300 }],
  }));

  return (
    <View style={[styles.track, { backgroundColor: colors.surfaceTertiary }]}>
      {indeterminate ? (
        <Animated.View
          style={[styles.indeterminate, { backgroundColor: colors.brand }, indStyle]}
        />
      ) : (
        <View
          style={[
            styles.fill,
            { backgroundColor: colors.brand, width: `${Math.min(1, Math.max(0, progress)) * 100}%` },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 4, borderRadius: 2, overflow: "hidden", width: "100%" },
  fill: { height: 4, borderRadius: 2 },
  indeterminate: { height: 4, width: "35%", borderRadius: 2 },
});
