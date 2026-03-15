import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { useTheme } from "@/hooks/useTheme";
import { spacing } from "@/styles";

import type { ColorSectionProps } from "./types";

export function ColorSection({ title, children }: ColorSectionProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <AppText variant="label" color={colors.textSecondary}>
        {title}
      </AppText>
      <View style={styles.rows}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  rows: {
    gap: spacing.xs,
  },
});
