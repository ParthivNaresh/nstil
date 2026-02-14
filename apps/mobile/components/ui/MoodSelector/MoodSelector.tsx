import { useCallback } from "react";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { useTheme } from "@/hooks/useTheme";
import { spacing } from "@/styles";

import { MoodItem } from "./MoodItem";
import { MOOD_OPTIONS } from "./moods";
import type { MoodSelectorProps, MoodValue } from "./types";

export function MoodSelector({
  value,
  onChange,
  label,
  accessibilityLabel,
  testID,
}: MoodSelectorProps) {
  const { colors } = useTheme();

  const handleSelect = useCallback(
    (mood: MoodValue) => {
      onChange(mood);
    },
    [onChange],
  );

  return (
    <View
      style={styles.container}
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel ?? label}
      testID={testID}
    >
      {label ? (
        <AppText variant="caption" color={colors.textSecondary}>
          {label}
        </AppText>
      ) : null}
      <View style={styles.options}>
        {MOOD_OPTIONS.map((option) => (
          <MoodItem
            key={option.value}
            option={option}
            isSelected={value === option.value}
            onSelect={() => handleSelect(option.value)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    gap: spacing.xs,
  },
  options: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
