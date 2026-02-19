import * as Haptics from "expo-haptics";
import { useCallback, useMemo } from "react";
import { Pressable } from "react-native";
import { View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { useTheme } from "@/hooks/useTheme";

import { styles } from "./styles";
import type { JournalPickerItemProps } from "./types";

const CUSTOM_COLOR_BG_OPACITY = 0.12;

export function JournalPickerItem({
  journal,
  isSelected,
  onPress,
}: JournalPickerItemProps) {
  const { colors } = useTheme();

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress(journal.id);
  }, [journal.id, onPress]);

  const dotColor = journal.color ?? colors.accent;

  const pillStyle = useMemo(() => {
    if (isSelected) {
      const bgColor = journal.color
        ? `${journal.color}${Math.round(CUSTOM_COLOR_BG_OPACITY * 255).toString(16).padStart(2, "0")}`
        : colors.accentMuted;
      const borderColor = journal.color ?? colors.accent;
      return { backgroundColor: bgColor, borderColor };
    }
    return { backgroundColor: colors.glass, borderColor: colors.glassBorder };
  }, [isSelected, journal.color, colors]);

  const textColor = useMemo(() => {
    if (isSelected) {
      return journal.color ?? colors.accent;
    }
    return colors.textSecondary;
  }, [isSelected, journal.color, colors]);

  return (
    <Pressable
      onPress={handlePress}
      style={[styles.pill, pillStyle]}
      accessibilityRole="radio"
      accessibilityState={{ selected: isSelected }}
      accessibilityLabel={journal.name}
    >
      <View style={[styles.colorDot, { backgroundColor: dotColor }]} />
      <AppText variant="caption" color={textColor}>
        {journal.name}
      </AppText>
    </Pressable>
  );
}
