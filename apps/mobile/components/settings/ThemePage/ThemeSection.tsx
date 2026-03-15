import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { useTheme } from "@/hooks/useTheme";
import { spacing } from "@/styles";

import type { ThemeSectionProps } from "./types";

export function ThemeSection({ title, children }: ThemeSectionProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <AppText variant="label" color={colors.textSecondary}>
        {title}
      </AppText>
      <View style={styles.grid}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
});
