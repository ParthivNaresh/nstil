import { View } from "react-native";

import { AppText } from "@/components/ui";
import { useTheme } from "@/hooks/useTheme";
import { WEEKDAY_LABELS } from "@/lib/calendarUtils";

import { styles } from "./styles";

export function CalendarWeekdayRow() {
  const { colors } = useTheme();

  return (
    <View style={styles.weekdayRow}>
      {WEEKDAY_LABELS.map((label, index) => (
        <View key={index} style={styles.weekdayCell}>
          <AppText variant="caption" color={colors.textTertiary}>
            {label}
          </AppText>
        </View>
      ))}
    </View>
  );
}
