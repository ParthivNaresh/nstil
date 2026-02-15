import * as Haptics from "expo-haptics";
import { useCallback } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppText } from "@/components/ui/AppText";
import { JournalPickerItem } from "@/components/journal/JournalPicker/JournalPickerItem";
import { useTheme } from "@/hooks/useTheme";
import { styles as pickerStyles } from "@/components/journal/JournalPicker/styles";

import type { JournalFilterBarProps } from "./types";

export function JournalFilterBar({
  journals,
  selectedId,
  onSelect,
}: JournalFilterBarProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const isAllSelected = selectedId === null;

  const handleAllPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(null);
  }, [onSelect]);

  const handleJournalPress = useCallback(
    (id: string) => {
      onSelect(id);
    },
    [onSelect],
  );

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={pickerStyles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <Pressable
        onPress={handleAllPress}
        style={[
          pickerStyles.pill,
          {
            backgroundColor: isAllSelected ? colors.accentMuted : colors.glass,
            borderColor: isAllSelected ? colors.accent : colors.glassBorder,
          },
        ]}
        accessibilityRole="radio"
        accessibilityState={{ selected: isAllSelected }}
      >
        <View
          style={[pickerStyles.colorDot, { backgroundColor: colors.accent }]}
        />
        <AppText
          variant="caption"
          color={isAllSelected ? colors.accent : colors.textSecondary}
        >
          {t("history.allJournals")}
        </AppText>
      </Pressable>

      {journals.map((journal) => (
        <JournalPickerItem
          key={journal.id}
          journal={journal}
          isSelected={journal.id === selectedId}
          onPress={handleJournalPress}
        />
      ))}
    </ScrollView>
  );
}
