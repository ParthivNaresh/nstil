import { useCallback } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppText } from "@/components/ui/AppText";
import { colors, radius, spacing } from "@/styles";
import type { EntryType } from "@/types";

import { ENTRY_TYPE_OPTIONS } from "./entryTypes";
import type { EntryTypeSelectorProps } from "./types";

export function EntryTypeSelector({
  value,
  onChange,
  label,
}: EntryTypeSelectorProps) {
  const { t } = useTranslation();

  const handleSelect = useCallback(
    (type: EntryType) => {
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
              style={[styles.option, isSelected && styles.optionSelected]}
              onPress={() => handleSelect(option.value)}
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
    width: "100%",
    gap: spacing.xs,
  },
  options: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  option: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glass,
  },
  optionSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentMuted,
  },
});
