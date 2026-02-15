import { Pressable, StyleSheet } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { useTheme } from "@/hooks/useTheme";
import { formatPickerDate, formatPickerTime } from "@/lib/dateFormatUtils";

import type { DateTimeTriggerProps } from "./types";

export function DateTimeTrigger({
  value,
  isBackdated,
  onPress,
}: DateTimeTriggerProps) {
  const { colors } = useTheme();
  const color = isBackdated ? colors.accent : colors.textTertiary;
  const dateStr = formatPickerDate(value);
  const timeStr = formatPickerTime(value);

  return (
    <Pressable
      onPress={onPress}
      style={styles.trigger}
      accessibilityRole="button"
      accessibilityLabel={`${dateStr} at ${timeStr}`}
    >
      <AppText variant="caption" color={color}>
        {dateStr} — {timeStr}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  trigger: {
    alignSelf: "flex-start",
    paddingVertical: 2,
  },
});
