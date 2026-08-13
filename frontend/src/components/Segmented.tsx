import { ScrollView, Pressable, StyleSheet } from "react-native";

import { AppText } from "@/src/components/AppText";
import { useTheme } from "@/src/theme/ThemeProvider";

interface Props {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  testIDPrefix?: string;
}

export function Segmented({ options, value, onChange, testIDPrefix = "seg" }: Props) {
  const { colors } = useTheme();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
      style={styles.row}
    >
      {options.map((opt) => {
        const active = opt === value;
        return (
          <Pressable
            key={opt}
            testID={`${testIDPrefix}-${opt.toLowerCase()}`}
            onPress={() => onChange(opt)}
            style={[
              styles.chip,
              {
                backgroundColor: active ? colors.brand : colors.surfaceSecondary,
                borderColor: active ? colors.brand : colors.border,
              },
            ]}
          >
            <AppText
              variant="label"
              color={active ? colors.onBrandPrimary : colors.onSurfaceSecondary}
            >
              {opt}
            </AppText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { maxHeight: 56 },
  content: { gap: 8, paddingHorizontal: 16, alignItems: "center", height: 56 },
  chip: {
    height: 36,
    flexShrink: 0,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});
