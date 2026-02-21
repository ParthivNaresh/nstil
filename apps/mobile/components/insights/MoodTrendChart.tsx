import {
  Canvas,
  Circle,
  LinearGradient,
  Path,
  Skia,
  vec,
} from "@shopify/react-native-skia";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useTranslation } from "react-i18next";

import { AppText, Card } from "@/components/ui";
import { useTheme } from "@/hooks/useTheme";
import { withAlpha } from "@/lib/colorUtils";
import { getMoodAccentColor, getMoodGradient } from "@/lib/moodColors";
import { duration, easing, radius, spacing } from "@/styles";
import type { DailyMoodCount, MoodCategory } from "@/types";

interface MoodTrendChartProps {
  readonly items: readonly DailyMoodCount[];
}

interface DayMoodData {
  readonly dateKey: string;
  readonly label: string;
  readonly dayNumber: string;
  readonly distribution: Readonly<Record<string, number>>;
  readonly total: number;
  readonly hasData: boolean;
  readonly dominantMood: MoodCategory | null;
}

interface WheelSegment {
  readonly mood: MoodCategory;
  readonly count: number;
  readonly startAngle: number;
  readonly sweepAngle: number;
}

const DISPLAY_DAYS = 7;
const WHEEL_SIZE = 150;
const STROKE_WIDTH = 18;
const SEGMENT_GAP_DEGREES = 3;
const EMPTY_RING_OPACITY = 0.1;
const SWIPE_THRESHOLD = 40;
const SWIPE_VELOCITY_THRESHOLD = 300;
const DATE_PILL_SIZE = 36;
const PILL_IDLE_OPACITY = 0.15;
const PILL_SELECTED_OPACITY = 0.3;
const PILL_BORDER_OPACITY = 0.35;
const WHEEL_ANIM_DURATION = 500;

const TRACKED_MOODS: readonly MoodCategory[] = ["happy", "calm", "sad", "anxious", "angry"];
const DAY_LABELS: readonly string[] = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function groupByDate(
  items: readonly DailyMoodCount[],
): Map<string, Record<string, number>> {
  const map = new Map<string, Record<string, number>>();
  for (const item of items) {
    const existing = map.get(item.date);
    if (existing) {
      existing[item.mood_category] = (existing[item.mood_category] ?? 0) + item.entry_count;
    } else {
      map.set(item.date, { [item.mood_category]: item.entry_count });
    }
  }
  return map;
}

function findDominantMood(distribution: Readonly<Record<string, number>>): MoodCategory | null {
  let maxCount = 0;
  let dominant: MoodCategory | null = null;
  for (const mood of TRACKED_MOODS) {
    const count = distribution[mood] ?? 0;
    if (count > maxCount) {
      maxCount = count;
      dominant = mood;
    }
  }
  return dominant;
}

function buildDayData(items: readonly DailyMoodCount[]): DayMoodData[] {
  const grouped = groupByDate(items);
  const today = new Date();
  const result: DayMoodData[] = [];

  for (let i = DISPLAY_DAYS - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = toISODate(d);
    const distribution = grouped.get(key);
    const dayOfWeek = d.getDay();

    if (distribution) {
      const total = Object.values(distribution).reduce((s, c) => s + c, 0);
      result.push({
        dateKey: key,
        label: DAY_LABELS[dayOfWeek],
        dayNumber: String(d.getDate()),
        distribution,
        total,
        hasData: total > 0,
        dominantMood: findDominantMood(distribution),
      });
    } else {
      result.push({
        dateKey: key,
        label: DAY_LABELS[dayOfWeek],
        dayNumber: String(d.getDate()),
        distribution: {},
        total: 0,
        hasData: false,
        dominantMood: null,
      });
    }
  }

  return result;
}

function computeWheelSegments(day: DayMoodData): WheelSegment[] {
  if (day.total === 0) return [];

  const moods = TRACKED_MOODS.filter((m) => (day.distribution[m] ?? 0) > 0);
  if (moods.length === 0) return [];

  if (moods.length === 1) {
    return [{
      mood: moods[0],
      count: day.distribution[moods[0]] ?? 0,
      startAngle: -90,
      sweepAngle: 360,
    }];
  }

  const totalGap = SEGMENT_GAP_DEGREES * moods.length;
  const availableDegrees = 360 - totalGap;
  const segments: WheelSegment[] = [];
  let currentAngle = -90;

  for (const mood of moods) {
    const count = day.distribution[mood] ?? 0;
    const sweep = (count / day.total) * availableDegrees;
    segments.push({
      mood,
      count,
      startAngle: currentAngle,
      sweepAngle: sweep,
    });
    currentAngle += sweep + SEGMENT_GAP_DEGREES;
  }

  return segments;
}

function createArcPath(
  cx: number,
  cy: number,
  r: number,
  startAngleDeg: number,
  sweepAngleDeg: number,
): ReturnType<typeof Skia.Path.Make> {
  const path = Skia.Path.Make();
  const oval = Skia.XYWHRect(cx - r, cy - r, r * 2, r * 2);
  path.addArc(oval, startAngleDeg, sweepAngleDeg);
  return path;
}

function getActiveMoodsForDay(day: DayMoodData): MoodCategory[] {
  return TRACKED_MOODS.filter((m) => (day.distribution[m] ?? 0) > 0);
}

function DatePill({
  day,
  isSelected,
  isToday,
  onSelect,
  textPrimary,
  textTertiary,
  glassBorder,
}: {
  readonly day: DayMoodData;
  readonly isSelected: boolean;
  readonly isToday: boolean;
  readonly onSelect: (dateKey: string) => void;
  readonly textPrimary: string;
  readonly textTertiary: string;
  readonly glassBorder: string;
}) {
  const handlePress = useCallback(() => {
    onSelect(day.dateKey);
  }, [day.dateKey, onSelect]);

  const moodColor = day.dominantMood
    ? getMoodAccentColor(day.dominantMood)
    : null;

  const pillBg = isSelected && moodColor
    ? withAlpha(moodColor, PILL_SELECTED_OPACITY)
    : moodColor
      ? withAlpha(moodColor, PILL_IDLE_OPACITY)
      : "transparent";

  const borderColor = isSelected && moodColor
    ? withAlpha(moodColor, PILL_BORDER_OPACITY)
    : isToday
      ? withAlpha(glassBorder, 0.3)
      : "transparent";

  const labelColor = isSelected ? textPrimary : textTertiary;
  const numberColor = moodColor && !isSelected
    ? withAlpha(moodColor, 0.9)
    : isSelected
      ? textPrimary
      : textTertiary;

  return (
    <Pressable onPress={handlePress} style={styles.datePillWrapper}>
      <AppText variant="caption" color={withAlpha(labelColor, 0.7)}>
        {day.label}
      </AppText>
      <View
        style={[
          styles.datePill,
          {
            backgroundColor: pillBg,
            borderColor,
          },
        ]}
      >
        <AppText variant="caption" color={numberColor} style={styles.datePillText}>
          {day.dayNumber}
        </AppText>
      </View>
    </Pressable>
  );
}

function MoodWheel({
  day,
  emptyColor,
  progress,
}: {
  readonly day: DayMoodData;
  readonly emptyColor: string;
  readonly progress: number;
}) {
  const segments = useMemo(() => computeWheelSegments(day), [day]);
  const cx = WHEEL_SIZE / 2;
  const cy = WHEEL_SIZE / 2;
  const r = (WHEEL_SIZE - STROKE_WIDTH) / 2;

  if (!day.hasData) {
    return (
      <Canvas style={styles.wheelCanvas}>
        <Circle
          cx={cx}
          cy={cy}
          r={r}
          style="stroke"
          strokeWidth={STROKE_WIDTH}
          color={withAlpha(emptyColor, EMPTY_RING_OPACITY)}
        />
      </Canvas>
    );
  }

  const cap = segments.length === 1 ? "round" : "butt";

  return (
    <Canvas style={styles.wheelCanvas}>
      {segments.map((segment) => {
        const animatedSweep = segment.sweepAngle * progress;
        if (animatedSweep < 0.5) return null;

        const path = createArcPath(cx, cy, r, segment.startAngle, animatedSweep);
        const gradient = getMoodGradient(segment.mood);

        const midAngle = segment.startAngle + animatedSweep / 2;
        const midRad = (midAngle * Math.PI) / 180;
        const gradStart = vec(
          cx + r * Math.cos(midRad - Math.PI / 4),
          cy + r * Math.sin(midRad - Math.PI / 4),
        );
        const gradEnd = vec(
          cx + r * Math.cos(midRad + Math.PI / 4),
          cy + r * Math.sin(midRad + Math.PI / 4),
        );

        return (
          <Path
            key={segment.mood}
            path={path}
            style="stroke"
            strokeWidth={STROKE_WIDTH}
            strokeCap={cap}
          >
            <LinearGradient
              start={gradStart}
              end={gradEnd}
              colors={[gradient.from, gradient.to]}
            />
          </Path>
        );
      })}
    </Canvas>
  );
}

export function MoodTrendChart({ items }: MoodTrendChartProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const dayData = useMemo(() => buildDayData(items), [items]);

  const todayKey = useMemo(() => toISODate(new Date()), []);
  const [selectedDate, setSelectedDate] = useState(todayKey);

  const wheelProgress = useSharedValue(0);
  const [renderProgress, setRenderProgress] = useState(0);

  useEffect(() => {
    wheelProgress.value = 0;
    setRenderProgress(0);

    const steps = 20;
    const stepDuration = WHEEL_ANIM_DURATION / steps;
    let step = 0;

    const interval = setInterval(() => {
      step++;
      const t = step / steps;
      const eased = 1 - Math.pow(1 - t, 3);
      setRenderProgress(eased);

      if (step >= steps) {
        clearInterval(interval);
        setRenderProgress(1);
      }
    }, stepDuration);

    return () => clearInterval(interval);
  }, [selectedDate, wheelProgress]);

  const selectedDay = useMemo(
    () => dayData.find((d) => d.dateKey === selectedDate) ?? dayData[dayData.length - 1],
    [dayData, selectedDate],
  );

  const selectedIndex = useMemo(
    () => dayData.findIndex((d) => d.dateKey === selectedDate),
    [dayData, selectedDate],
  );

  const activeMoods = useMemo(
    () => getActiveMoodsForDay(selectedDay),
    [selectedDay],
  );

  const navigateDay = useCallback(
    (direction: -1 | 1) => {
      const newIndex = selectedIndex + direction;
      if (newIndex >= 0 && newIndex < dayData.length) {
        setSelectedDate(dayData[newIndex].dateKey);
      }
    },
    [selectedIndex, dayData],
  );

  const translateX = useSharedValue(0);

  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-SWIPE_THRESHOLD / 2, SWIPE_THRESHOLD / 2])
    .onUpdate((e) => {
      translateX.value = e.translationX * 0.3;
    })
    .onEnd((e) => {
      translateX.value = withSpring(0, easing.spring);

      const swipedLeft =
        e.translationX < -SWIPE_THRESHOLD || e.velocityX < -SWIPE_VELOCITY_THRESHOLD;
      const swipedRight =
        e.translationX > SWIPE_THRESHOLD || e.velocityX > SWIPE_VELOCITY_THRESHOLD;

      if (swipedLeft) {
        navigateDay(1);
      } else if (swipedRight) {
        navigateDay(-1);
      }
    })
    .runOnJS(true);

  const wheelAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const centerOpacity = useSharedValue(0);

  useEffect(() => {
    centerOpacity.value = 0;
    centerOpacity.value = withTiming(1, {
      duration: duration.slow,
      easing: Easing.out(Easing.cubic),
    });
  }, [selectedDate, centerOpacity]);

  const centerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: centerOpacity.value,
  }));

  const hasAnyData = useMemo(
    () => dayData.some((d) => d.hasData),
    [dayData],
  );

  if (!hasAnyData) {
    return null;
  }

  const entryCount = selectedDay.total;

  return (
    <Card>
      <View style={styles.container}>
        <View style={styles.dateStrip}>
          {dayData.map((day) => (
            <DatePill
              key={day.dateKey}
              day={day}
              isSelected={day.dateKey === selectedDate}
              isToday={day.dateKey === todayKey}
              onSelect={setSelectedDate}
              textPrimary={colors.textPrimary}
              textTertiary={colors.textTertiary}
              glassBorder={colors.glassBorder}
            />
          ))}
        </View>

        <View style={styles.wheelRow}>
          {activeMoods.length > 0 ? (
            <View style={styles.legend}>
              {activeMoods.map((mood) => (
                <View key={mood} style={styles.legendItem}>
                  <View
                    style={[
                      styles.legendDot,
                      { backgroundColor: getMoodAccentColor(mood) },
                    ]}
                  />
                  <AppText variant="caption" color={colors.textSecondary}>
                    {mood}
                  </AppText>
                </View>
              ))}
            </View>
          ) : null}

          <GestureDetector gesture={swipeGesture}>
            <Animated.View style={[styles.wheelContainer, wheelAnimatedStyle]}>
              <MoodWheel
                day={selectedDay}
                emptyColor={colors.textTertiary}
                progress={renderProgress}
              />

              <Animated.View style={[styles.wheelCenter, centerAnimatedStyle]}>
                {selectedDay.hasData ? (
                  <>
                    <AppText variant="h2" color={colors.textPrimary}>
                      {entryCount}
                    </AppText>
                    <AppText variant="caption" color={colors.textTertiary}>
                      {entryCount === 1 ? "entry" : "entries"}
                    </AppText>
                  </>
                ) : (
                  <AppText variant="caption" color={withAlpha(colors.textTertiary, 0.6)}>
                    {t("insights.noEntries")}
                  </AppText>
                )}
              </Animated.View>
            </Animated.View>
          </GestureDetector>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  dateStrip: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  datePillWrapper: {
    alignItems: "center",
    gap: 4,
    flex: 1,
  },
  datePill: {
    width: DATE_PILL_SIZE,
    height: DATE_PILL_SIZE,
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  datePillText: {
    fontWeight: "600",
  },
  wheelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg,
  },
  wheelContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
  },
  wheelCanvas: {
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
  },
  wheelCenter: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  legend: {
    gap: spacing.sm,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
