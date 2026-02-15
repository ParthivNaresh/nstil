import {
  Canvas,
  Circle,
  LinearGradient,
  vec,
} from "@shopify/react-native-skia";
import { memo, useCallback, useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { AppText } from "@/components/ui/AppText";
import { useTheme } from "@/hooks/useTheme";
import { withAlpha } from "@/lib/colorUtils";
import { getMoodGradient } from "@/lib/moodColors";
import type { MoodCategory } from "@/types";

import { CELL_SIZE, styles } from "./styles";

interface CalendarDayCellProps {
  readonly date: number;
  readonly dateString: string;
  readonly isCurrentMonth: boolean;
  readonly isToday: boolean;
  readonly isFuture: boolean;
  readonly isSelected: boolean;
  readonly moodCategory: MoodCategory | null;
  readonly entryCount: number;
  readonly onPress?: (dateString: string) => void;
}

const MOOD_FILL_OPACITY = 0.25;
const TODAY_FILL_OPACITY = 0.1;
const OUTSIDE_MONTH_OPACITY = 0.35;
const FUTURE_OPACITY = 0.4;
const CELL_RADIUS = CELL_SIZE / 2;

const TODAY_SUBTLE_OPACITY = 0.3;
const SELECTED_RING_OPACITY = 0.7;
const SELECTED_BORDER_WIDTH = 1.5;
const SELECTION_DURATION = 200;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const CalendarDayCell = memo(function CalendarDayCell({
  date,
  dateString,
  isCurrentMonth,
  isToday,
  isFuture,
  isSelected,
  moodCategory,
  entryCount,
  onPress,
}: CalendarDayCellProps) {
  const { colors } = useTheme();
  const hasEntries = entryCount > 0;
  const hasMood = moodCategory !== null;
  const gradient = hasMood ? getMoodGradient(moodCategory) : null;
  const isTappable = isCurrentMonth && !isFuture;
  const ringBaseColor = gradient?.from ?? colors.accent;

  const selectionProgress = useSharedValue(isSelected ? 1 : 0);

  useEffect(() => {
    selectionProgress.value = withTiming(isSelected ? 1 : 0, {
      duration: SELECTION_DURATION,
    });
  }, [isSelected, selectionProgress]);

  const handlePress = useCallback(() => {
    if (isTappable && onPress) {
      onPress(dateString);
    }
  }, [isTappable, onPress, dateString]);

  const textColor = (() => {
    if (!isCurrentMonth) return withAlpha(colors.textSecondary, OUTSIDE_MONTH_OPACITY);
    if (isFuture) return withAlpha(colors.textSecondary, FUTURE_OPACITY);
    if (isToday && gradient) return gradient.from;
    if (isToday) return colors.accent;
    if (gradient) return gradient.from;
    if (hasEntries) return colors.textPrimary;
    return colors.textSecondary;
  })();

  const showSkiaFill = isCurrentMonth && !isFuture && (hasMood || isToday);

  const todaySubtleColor = withAlpha(ringBaseColor, TODAY_SUBTLE_OPACITY);
  const selectedRingColor = withAlpha(ringBaseColor, SELECTED_RING_OPACITY);

  const animatedStyle = useAnimatedStyle(() => {
    const progress = selectionProgress.value;

    if (isToday) {
      const borderColor = interpolateColor(
        progress,
        [0, 1],
        [todaySubtleColor, selectedRingColor],
      );
      return {
        borderWidth: SELECTED_BORDER_WIDTH,
        borderColor,
      };
    }

    return {
      borderWidth: SELECTED_BORDER_WIDTH * progress,
      borderColor: selectedRingColor,
    };
  });

  const staticBorderColor = (() => {
    if (hasMood && isCurrentMonth && !isFuture && !isToday) {
      return withAlpha(gradient!.from, 0.15);
    }
    return "transparent";
  })();

  const dotColor = (() => {
    if (!hasEntries || !isCurrentMonth || isFuture) return null;
    if (gradient) return withAlpha(gradient.from, 0.5);
    return withAlpha(colors.textTertiary, 0.3);
  })();

  const staticStyle = hasMood && isCurrentMonth && !isFuture && !isToday
    ? [styles.dayCellBorder, { borderColor: staticBorderColor }]
    : undefined;

  return (
    <View style={styles.dayCellOuter}>
      <AnimatedPressable
        onPress={handlePress}
        disabled={!isTappable || !onPress}
        style={[styles.dayCell, staticStyle, animatedStyle]}
        accessibilityLabel={`${dateString}, ${entryCount} entries`}
      >
        {showSkiaFill ? (
          <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
            <Circle cx={CELL_RADIUS} cy={CELL_RADIUS} r={CELL_RADIUS}>
              <LinearGradient
                start={vec(0, 0)}
                end={vec(CELL_SIZE, CELL_SIZE)}
                colors={
                  gradient
                    ? [
                        withAlpha(gradient.from, MOOD_FILL_OPACITY),
                        withAlpha(gradient.to, MOOD_FILL_OPACITY * 0.6),
                      ]
                    : [
                        withAlpha(colors.accent, TODAY_FILL_OPACITY),
                        withAlpha(colors.accent, TODAY_FILL_OPACITY * 0.5),
                      ]
                }
              />
            </Circle>
          </Canvas>
        ) : null}
        <AppText variant="caption" color={textColor}>
          {String(date)}
        </AppText>
      </AnimatedPressable>
      {dotColor ? (
        <View style={[styles.entryDot, { backgroundColor: dotColor }]} />
      ) : null}
    </View>
  );
});
