import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { AppText } from "@/components/ui/AppText";
import { useTheme } from "@/hooks/useTheme";
import { withAlpha } from "@/lib/colorUtils";
import { radius, spacing } from "@/styles";

const ITEM_HEIGHT = 36;
const VISIBLE_ITEMS = 3;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

const COLUMN_WIDTH_DEFAULT = 56;
const COLUMN_WIDTH_COMPACT = 40;

interface TimePickerProps {
  readonly hour: number;
  readonly minute: number;
  readonly onHourChange: (hour: number) => void;
  readonly onMinuteChange: (minute: number) => void;
  readonly maxHour?: number;
  readonly maxMinute?: number;
  readonly compact?: boolean;
}

interface WheelColumnProps {
  readonly items: readonly number[];
  readonly selected: number;
  readonly onChange: (value: number) => void;
  readonly formatValue: (value: number) => string;
  readonly maxValue?: number;
  readonly width: number;
}

function formatHour12(hour: number): string {
  const h = hour % 12;
  return h === 0 ? "12" : String(h);
}

function formatMinute(minute: number): string {
  return String(minute).padStart(2, "0");
}

function getPeriod(hour: number): "AM" | "PM" {
  return hour < 12 ? "AM" : "PM";
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

const WheelColumn = memo(function WheelColumn({
  items,
  selected,
  onChange,
  formatValue,
  maxValue,
  width,
}: WheelColumnProps) {
  const { colors } = useTheme();
  const scrollRef = useRef<ScrollView>(null);
  const isUserScrolling = useRef(false);

  const selectedIndex = items.indexOf(selected);

  useEffect(() => {
    if (!isUserScrolling.current && selectedIndex >= 0) {
      scrollRef.current?.scrollTo({
        y: selectedIndex * ITEM_HEIGHT,
        animated: false,
      });
    }
  }, [selectedIndex]);

  useEffect(() => {
    if (
      maxValue !== undefined &&
      selected > maxValue &&
      !isUserScrolling.current
    ) {
      const clampedIndex = items.indexOf(maxValue);
      if (clampedIndex >= 0) {
        scrollRef.current?.scrollTo({
          y: clampedIndex * ITEM_HEIGHT,
          animated: true,
        });
      }
    }
  }, [maxValue, selected, items]);

  const handleScrollBegin = useCallback(() => {
    isUserScrolling.current = true;
  }, []);

  const handleMomentumEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      isUserScrolling.current = false;
      const offsetY = event.nativeEvent.contentOffset.y;
      const index = Math.round(offsetY / ITEM_HEIGHT);
      const clamped = Math.max(0, Math.min(index, items.length - 1));
      const value = items[clamped];

      if (maxValue !== undefined && value > maxValue) {
        const clampedIndex = items.indexOf(maxValue);
        if (clampedIndex >= 0) {
          scrollRef.current?.scrollTo({
            y: clampedIndex * ITEM_HEIGHT,
            animated: true,
          });
        }
        if (maxValue !== selected) {
          onChange(maxValue);
        }
        return;
      }

      if (value !== selected) {
        onChange(value);
      }
    },
    [items, selected, onChange, maxValue],
  );

  return (
    <View style={[wheelStyles.column, { width }]}>
      <View
        style={[
          wheelStyles.highlight,
          { backgroundColor: withAlpha(colors.accent, 0.08) },
        ]}
        pointerEvents="none"
      />
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        contentContainerStyle={wheelStyles.scrollContent}
        onScrollBeginDrag={handleScrollBegin}
        onMomentumScrollEnd={handleMomentumEnd}
      >
        {items.map((item) => {
          const isSelected = item === selected;
          const isDisabled = maxValue !== undefined && item > maxValue;
          return (
            <View key={item} style={wheelStyles.item}>
              <AppText
                variant={isSelected ? "label" : "body"}
                color={
                  isDisabled
                    ? colors.textTertiary
                    : isSelected
                      ? colors.textPrimary
                      : colors.textSecondary
                }
              >
                {formatValue(item)}
              </AppText>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
});

export const TimePicker = memo(function TimePicker({
  hour,
  minute,
  onHourChange,
  onMinuteChange,
  maxHour,
  maxMinute,
  compact = false,
}: TimePickerProps) {
  const { colors } = useTheme();
  const period = getPeriod(hour);
  const columnWidth = compact ? COLUMN_WIDTH_COMPACT : COLUMN_WIDTH_DEFAULT;

  const effectiveMaxMinute = useMemo(() => {
    if (maxHour === undefined || maxMinute === undefined) return undefined;
    if (hour < maxHour) return undefined;
    if (hour === maxHour) return maxMinute;
    return 0;
  }, [hour, maxHour, maxMinute]);

  const handleHourChange = useCallback(
    (newHour: number) => {
      onHourChange(newHour);
    },
    [onHourChange],
  );

  const handleMinuteChange = useCallback(
    (newMinute: number) => {
      onMinuteChange(newMinute);
    },
    [onMinuteChange],
  );

  const togglePeriod = useCallback(() => {
    const newHour = hour < 12 ? hour + 12 : hour - 12;
    if (maxHour !== undefined && newHour > maxHour) return;
    onHourChange(newHour);
  }, [hour, maxHour, onHourChange]);

  const canTogglePeriod = useMemo(() => {
    if (maxHour === undefined) return true;
    const newHour = hour < 12 ? hour + 12 : hour - 12;
    return newHour <= maxHour;
  }, [hour, maxHour]);

  return (
    <View style={compact ? pickerStyles.containerCompact : pickerStyles.container}>
      <WheelColumn
        items={HOURS}
        selected={hour}
        onChange={handleHourChange}
        formatValue={formatHour12}
        maxValue={maxHour}
        width={columnWidth}
      />
      <AppText variant="label" color={colors.textSecondary}>
        :
      </AppText>
      <WheelColumn
        items={MINUTES}
        selected={minute}
        onChange={handleMinuteChange}
        formatValue={formatMinute}
        maxValue={effectiveMaxMinute}
        width={columnWidth}
      />
      <Pressable
        onPress={togglePeriod}
        disabled={!canTogglePeriod}
        style={[
          compact ? pickerStyles.periodButtonCompact : pickerStyles.periodButton,
          { backgroundColor: withAlpha(colors.accent, 0.1) },
        ]}
      >
        <AppText
          variant="label"
          color={canTogglePeriod ? colors.accent : colors.textTertiary}
        >
          {period}
        </AppText>
      </Pressable>
    </View>
  );
});

const wheelStyles = StyleSheet.create({
  column: {
    height: PICKER_HEIGHT,
    position: "relative",
  },
  highlight: {
    position: "absolute",
    top: ITEM_HEIGHT,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    borderRadius: radius.sm,
  },
  scrollContent: {
    paddingVertical: ITEM_HEIGHT,
  },
  item: {
    height: ITEM_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
});

const pickerStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  containerCompact: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  periodButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    marginLeft: spacing.sm,
  },
  periodButtonCompact: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
  },
});
