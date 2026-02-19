import { memo, useCallback } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { useTheme } from "@/hooks/useTheme";
import { withAlpha } from "@/lib/colorUtils";

interface PickerDayCellProps {
  readonly date: number;
  readonly dateString: string;
  readonly isCurrentMonth: boolean;
  readonly isToday: boolean;
  readonly isSelected: boolean;
  readonly isDisabled: boolean;
  readonly onPress: (dateString: string) => void;
}

const CELL_SIZE = 36;
const CELL_RADIUS = CELL_SIZE / 2;
const DOT_RESERVE_HEIGHT = 8;
const OUTSIDE_MONTH_OPACITY = 0.3;
const DISABLED_OPACITY = 0.3;

export const PickerDayCell = memo(function PickerDayCell({
  date,
  dateString,
  isCurrentMonth,
  isToday,
  isSelected,
  isDisabled,
  onPress,
}: PickerDayCellProps) {
  const { colors } = useTheme();

  const isEmpty = date === 0;

  const handlePress = useCallback(() => {
    if (!isDisabled && isCurrentMonth && !isEmpty) {
      onPress(dateString);
    }
  }, [isDisabled, isCurrentMonth, isEmpty, onPress, dateString]);

  if (isEmpty) {
    return <View style={localStyles.outer} />;
  }

  const textColor = (() => {
    if (!isCurrentMonth) return withAlpha(colors.textTertiary, OUTSIDE_MONTH_OPACITY);
    if (isDisabled) return withAlpha(colors.textTertiary, DISABLED_OPACITY);
    if (isSelected) return colors.accent;
    if (isToday) return colors.accent;
    return colors.textPrimary;
  })();

  const showRing = isSelected && isCurrentMonth;
  const showTodayDot = isToday && !isSelected && isCurrentMonth;

  return (
    <View style={localStyles.outer}>
      <Pressable
        onPress={handlePress}
        disabled={isDisabled || !isCurrentMonth}
        style={[
          localStyles.cell,
          showRing && { borderWidth: 1.5, borderColor: withAlpha(colors.accent, 0.6) },
        ]}
      >
        <AppText variant="caption" color={textColor}>
          {String(date)}
        </AppText>
      </Pressable>
      <View style={localStyles.dotReserve}>
        {showTodayDot ? (
          <View style={[localStyles.todayDot, { backgroundColor: colors.accent }]} />
        ) : null}
      </View>
    </View>
  );
});

const localStyles = StyleSheet.create({
  outer: {
    width: `${100 / 7}%`,
    alignItems: "center",
    justifyContent: "center",
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: CELL_RADIUS,
    alignItems: "center",
    justifyContent: "center",
  },
  dotReserve: {
    height: DOT_RESERVE_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
