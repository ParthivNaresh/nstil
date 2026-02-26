import * as Haptics from "expo-haptics";
import { Check } from "lucide-react-native";
import { useCallback } from "react";
import { Pressable, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { useTheme } from "@/hooks/useTheme";

import { CHECK_SIZE, styles } from "./styles";
import type { JournalFilterRowProps } from "./types";

export function JournalFilterRow({ journal, isSelected, onPress }: JournalFilterRowProps) {
  const { colors } = useTheme();

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress(journal.id);
  }, [journal.id, onPress]);

  const dotColor = journal.color ?? colors.accent;

  return (
    <Pressable
      onPress={handlePress}
      style={[
        styles.row,
        { backgroundColor: isSelected ? colors.glass : "transparent" },
      ]}
      accessibilityRole="radio"
      accessibilityState={{ selected: isSelected }}
      accessibilityLabel={journal.name}
    >
      <View style={[styles.colorDot, { backgroundColor: dotColor }]} />
      <AppText
        variant="body"
        color={isSelected ? colors.textPrimary : colors.textSecondary}
        style={styles.rowLabel}
      >
        {journal.name}
      </AppText>
      {isSelected ? (
        <Check size={CHECK_SIZE} color={colors.accent} strokeWidth={2.5} />
      ) : null}
    </Pressable>
  );
}
