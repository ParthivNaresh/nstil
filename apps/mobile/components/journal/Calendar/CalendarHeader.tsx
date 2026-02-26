import type { ReactNode } from "react";
import { View } from "react-native";

import { AppText } from "@/components/ui";
import { useTheme } from "@/hooks/useTheme";
import { MONTH_NAMES } from "@/lib/calendarUtils";

import { styles } from "./styles";

interface CalendarHeaderProps {
  readonly year: number;
  readonly month: number;
  readonly rightAction?: ReactNode;
}

export function CalendarHeader({ year, month, rightAction }: CalendarHeaderProps) {
  const { colors } = useTheme();
  const monthName = MONTH_NAMES[month - 1];

  return (
    <View style={styles.header}>
      <View style={styles.headerSpacer} />
      <View style={styles.headerCenter}>
        <AppText variant="label">{monthName}</AppText>
        <AppText variant="caption" color={colors.textTertiary}>
          {String(year)}
        </AppText>
      </View>
      <View style={styles.headerRight}>
        {rightAction}
      </View>
    </View>
  );
}
