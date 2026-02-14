import * as Haptics from "expo-haptics";
import { useCallback } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppText } from "@/components/ui/AppText";
import { useTheme } from "@/hooks/useTheme";
import { radius, spacing } from "@/styles";
import type { EntryType } from "@/types";

import { ENTRY_TYPE_OPTIONS } from "./entryTypes";
import type { EntryTypeSelectorProps } from "./types";

export function EntryTypeSelector({
  value,
  onChange,
  label,
}: EntryTypeSelectorProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const handleSelect = useCallback(
    (type: EntryType) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onChange(type);
    },
    [onChange],
  );

  return (
    <View style={styles.container}>
      {label ? (
        <AppText variant="caption" color={colors.textSecondary}>
          {label}
        </AppText>
      ) : null}
      <View style={styles.options}>
        {ENTRY_TYPE_OPTIONS.map((option) => {
          const isSelected = value === option.value;
          return (
            <Pressable
              key={option.value}
              onPress={() => handleSelect(option.value)}
              style={[
                styles.pill,
                {
                  backgroundColor: isSelected ? colors.accentMuted : colors.glass,
                  borderColor: isSelected ? colors.accent : colors.glassBorder,
                },
              ]}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
            >
              <AppText
                variant="caption"
                color={isSelected ? colors.accent : colors.textSecondary}
              >
                {t(option.labelKey)}
              </AppText>
            </Pressable>
          );
        })}
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
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  pill: {
    paddingHorizontal: spacing.md + 4,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.full,
    borderWidth: 1,
  },
});
