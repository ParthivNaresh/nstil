import * as Haptics from "expo-haptics";
import { useCallback } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppText } from "@/components/ui";
import { useTheme } from "@/hooks/useTheme";
import { BREATHING_PATTERN_LIST } from "@/lib/breathingPatterns";
import { withAlpha } from "@/lib/colorUtils";
import { radius, spacing } from "@/styles";
import type { BreathingPatternConfig, BreathingPatternId } from "@/types/breathing";

interface BreathingPatternPickerProps {
  readonly selected: BreathingPatternId;
  readonly onSelect: (id: BreathingPatternId) => void;
}

interface PatternOptionProps {
  readonly pattern: BreathingPatternConfig;
  readonly isSelected: boolean;
  readonly onPress: (id: BreathingPatternId) => void;
}

const SELECTED_BG_OPACITY = 0.12;
const IDLE_BG_OPACITY = 0.04;

function PatternOption({ pattern, isSelected, onPress }: PatternOptionProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress(pattern.id);
  }, [pattern.id, onPress]);

  const bgOpacity = isSelected ? SELECTED_BG_OPACITY : IDLE_BG_OPACITY;
  const borderColor = isSelected ? colors.accent : colors.glassBorder;

  return (
    <Pressable
      onPress={handlePress}
      style={[
        styles.option,
        {
          backgroundColor: withAlpha(colors.accent, bgOpacity),
          borderColor,
        },
      ]}
      accessibilityRole="radio"
      accessibilityState={{ selected: isSelected }}
      accessibilityLabel={t(pattern.nameKey)}
    >
      <AppText
        variant="label"
        color={isSelected ? colors.accent : colors.textPrimary}
      >
        {t(pattern.nameKey)}
      </AppText>
      <AppText variant="caption" color={colors.textSecondary} numberOfLines={2}>
        {t(pattern.descriptionKey)}
      </AppText>
    </Pressable>
  );
}

export function BreathingPatternPicker({ selected, onSelect }: BreathingPatternPickerProps) {
  return (
    <View style={styles.container} accessibilityRole="radiogroup">
      {BREATHING_PATTERN_LIST.map((pattern) => (
        <PatternOption
          key={pattern.id}
          pattern={pattern}
          isSelected={selected === pattern.id}
          onPress={onSelect}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  option: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.xs,
  },
});
