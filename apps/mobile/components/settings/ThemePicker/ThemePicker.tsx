import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppText } from "@/components/ui/AppText";
import { useTheme } from "@/hooks/useTheme";
import { spacing } from "@/styles";

import { ThemeModeCard } from "./ThemeModeCard";
import { THEME_MODE_OPTIONS } from "./themeModes";
import type { ThemePickerProps } from "./types";

export function ThemePicker({ currentMode, onSelect }: ThemePickerProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <View style={styles.container} accessibilityRole="radiogroup">
      <AppText variant="label" color={colors.textSecondary}>
        {t("settings.theme")}
      </AppText>
      <View style={styles.options}>
        {THEME_MODE_OPTIONS.map((option) => (
          <ThemeModeCard
            key={option.value}
            option={option}
            isSelected={currentMode === option.value}
            onSelect={onSelect}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  options: {
    flexDirection: "row",
    gap: spacing.sm,
  },
});
