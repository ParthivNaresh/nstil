import * as Haptics from "expo-haptics";
import { useCallback } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppText } from "@/components/ui";
import { useTheme } from "@/hooks/useTheme";
import { withAlpha } from "@/lib/colorUtils";
import { radius, spacing } from "@/styles";

interface BreathingDurationPickerProps {
  readonly selected: number;
  readonly options: readonly number[];
  readonly onSelect: (minutes: number) => void;
}

interface DurationOptionProps {
  readonly minutes: number;
  readonly isSelected: boolean;
  readonly onPress: (minutes: number) => void;
}

const SELECTED_BG_OPACITY = 0.15;
const IDLE_BG_OPACITY = 0.04;

function DurationOption({ minutes, isSelected, onPress }: DurationOptionProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress(minutes);
  }, [minutes, onPress]);

  const bgOpacity = isSelected ? SELECTED_BG_OPACITY : IDLE_BG_OPACITY;
  const borderColor = isSelected ? colors.accent : colors.glassBorder;
  const textColor = isSelected ? colors.accent : colors.textPrimary;

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
      accessibilityLabel={t("breathing.duration.minutes", { count: minutes })}
    >
      <AppText variant="label" color={textColor}>
        {t("breathing.duration.minutes", { count: minutes })}
      </AppText>
    </Pressable>
  );
}

export function BreathingDurationPicker({
  selected,
  options,
  onSelect,
}: BreathingDurationPickerProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <AppText variant="caption" color={colors.textSecondary}>
        {t("breathing.duration.label")}
      </AppText>
      <View style={styles.row} accessibilityRole="radiogroup">
        {options.map((minutes) => (
          <DurationOption
            key={minutes}
            minutes={minutes}
            isSelected={selected === minutes}
            onPress={onSelect}
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
  row: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  option: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    alignItems: "center",
  },
});
