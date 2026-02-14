import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Calendar } from "lucide-react-native";
import { useCallback } from "react";
import { View } from "react-native";

import { Icon } from "@/components/ui/Icon";
import { useTheme } from "@/hooks/useTheme";

import { styles } from "./styles";
import type { EntryDatePickerProps } from "./types";

function isToday(date: Date): boolean {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

export function EntryDatePicker({
  value,
  onChange,
  maximumDate,
}: EntryDatePickerProps) {
  const { colors, isDark } = useTheme();

  const backdated = !isToday(value);
  const iconColor = backdated ? colors.accent : colors.textTertiary;
  const borderColor = backdated ? colors.accent : colors.glassBorder;

  const handleChange = useCallback(
    (_event: DateTimePickerEvent, selectedDate?: Date) => {
      if (selectedDate) {
        onChange(selectedDate);
      }
    },
    [onChange],
  );

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.glass, borderColor },
      ]}
    >
      <Icon icon={Calendar} size="xs" color={iconColor} />
      <DateTimePicker
        value={value}
        mode="datetime"
        display="compact"
        onChange={handleChange}
        maximumDate={maximumDate}
        themeVariant={isDark ? "dark" : "light"}
        accentColor={colors.accent}
      />
    </View>
  );
}
