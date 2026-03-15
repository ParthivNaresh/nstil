import { Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { useTheme } from "@/hooks/useTheme";
import { radius, spacing } from "@/styles";

import type { ColorRowProps } from "./types";

const SWATCH_SIZE = 28;

export function ColorRow({ label, color, onPress }: ColorRowProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[styles.container, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <AppText variant="body" color={colors.textPrimary}>
        {label}
      </AppText>
      <View style={styles.right}>
        <AppText variant="caption" color={colors.textTertiary}>
          {color}
        </AppText>
        <View
          style={[
            styles.swatch,
            { backgroundColor: color, borderColor: colors.glassBorder },
          ]}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  swatch: {
    width: SWATCH_SIZE,
    height: SWATCH_SIZE,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
});
