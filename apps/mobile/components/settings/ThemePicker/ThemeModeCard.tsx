import * as Haptics from "expo-haptics";
import { Check } from "lucide-react-native";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { useTheme } from "@/hooks/useTheme";
import { radius, spacing } from "@/styles";

import type { ThemeModeCardProps } from "./types";

const PREVIEW_SIZE = 48;
const PREVIEW_INNER_SIZE = 20;
const CHECK_SIZE = 16;

export function ThemeModeCard({ option, isSelected, onSelect }: ThemeModeCardProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(option.value);
  }, [option.value, onSelect]);

  const [bg, surface, accent] = option.previewColors;

  return (
    <Pressable
      onPress={handlePress}
      style={[
        styles.card,
        {
          borderColor: isSelected ? colors.accent : colors.glassBorder,
          backgroundColor: isSelected ? colors.accentMuted : colors.glass,
        },
      ]}
      accessibilityRole="radio"
      accessibilityState={{ selected: isSelected }}
      accessibilityLabel={option.labelKey}
    >
      <View style={[styles.preview, { backgroundColor: bg }]}>
        <View style={[styles.previewSurface, { backgroundColor: surface }]}>
          <View style={[styles.previewAccent, { backgroundColor: accent }]} />
        </View>
      </View>

      <View style={styles.labelRow}>
        <AppText
          variant="caption"
          color={isSelected ? colors.accent : colors.textSecondary}
        >
          {t(option.labelKey)}
        </AppText>
        {isSelected ? (
          <Check size={CHECK_SIZE} color={colors.accent} />
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    alignItems: "center",
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    gap: spacing.xs,
  },
  preview: {
    width: PREVIEW_SIZE,
    height: PREVIEW_SIZE,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  previewSurface: {
    width: PREVIEW_INNER_SIZE + 8,
    height: PREVIEW_INNER_SIZE + 8,
    borderRadius: radius.xs,
    alignItems: "center",
    justifyContent: "center",
  },
  previewAccent: {
    width: PREVIEW_INNER_SIZE,
    height: 4,
    borderRadius: radius.full,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
});
