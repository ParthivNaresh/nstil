import { memo } from "react";
import { View } from "react-native";

import type { CalendarGridDay } from "@/lib/calendarUtils";
import type { CalendarDay } from "@/types";

import { CalendarDayCell } from "./CalendarDayCell";
import { styles } from "./styles";

interface CalendarRowProps {
  readonly cells: CalendarGridDay[];
  readonly dayMap: Map<string, CalendarDay>;
  readonly selectedDate?: string;
  readonly onDayPress?: (dateString: string) => void;
}

export const CalendarRow = memo(function CalendarRow({
  cells,
  dayMap,
  selectedDate,
  onDayPress,
}: CalendarRowProps) {
  return (
    <View style={styles.gridRow}>
      {cells.map((cell) => {
        const dayData = dayMap.get(cell.dateString);
        return (
          <CalendarDayCell
            key={cell.dateString}
            date={cell.date}
            dateString={cell.dateString}
            isCurrentMonth={cell.isCurrentMonth}
            isToday={cell.isToday}
            isFuture={cell.isFuture}
            isSelected={cell.dateString === selectedDate}
            moodCategory={dayData?.mood_category ?? null}
            entryCount={dayData?.entry_count ?? 0}
            onPress={onDayPress}
          />
        );
      })}
    </View>
  );
});
