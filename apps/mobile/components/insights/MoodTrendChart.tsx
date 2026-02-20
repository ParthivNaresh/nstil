import {
  Canvas,
  Circle,
  Line as SkiaLine,
  vec,
} from "@shopify/react-native-skia";
import { useMemo, useState } from "react";
import type { LayoutChangeEvent } from "react-native";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppText, Card } from "@/components/ui";
import { useTheme } from "@/hooks/useTheme";
import { withAlpha } from "@/lib/colorUtils";
import { getMoodAccentColor } from "@/lib/moodColors";
import { spacing } from "@/styles";
import type { AIInsight, MoodCategory } from "@/types";

interface MoodTrendChartProps {
  readonly insights: AIInsight[];
}

interface WeekMoodData {
  readonly label: string;
  readonly distribution: Readonly<Record<string, number>>;
  readonly total: number;
  readonly hasData: boolean;
}

interface ChartPoint {
  readonly x: number;
  readonly y: number;
  readonly hasData: boolean;
}

const CHART_HEIGHT = 160;
const CHART_PADDING_LEFT = 8;
const CHART_PADDING_RIGHT = 8;
const CHART_PADDING_TOP = 16;
const CHART_PADDING_BOTTOM = 28;
const DOT_RADIUS = 4;
const LINE_WIDTH = 2;
const LINE_OPACITY = 0.6;
const MIN_WEEKS_FOR_TREND = 2;
const MAX_WEEKS_DISPLAYED = 4;
const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

const TRACKED_MOODS: readonly MoodCategory[] = ["happy", "calm", "sad", "anxious", "angry"];

function parseDateParts(dateStr: string): Date | null {
  const parts = dateStr.split("-");
  if (parts.length !== 3) return null;
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
}

function formatWeekLabel(dateStr: string): string {
  const d = parseDateParts(dateStr);
  if (!d) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function extractDistribution(insight: AIInsight): Readonly<Record<string, number>> {
  const raw = insight.metadata.mood_distribution;
  if (typeof raw === "object" && raw !== null && !Array.isArray(raw)) {
    return raw as Record<string, number>;
  }
  return {};
}

function deduplicateByPeriod(summaries: readonly AIInsight[]): Map<string, AIInsight> {
  const byPeriod = new Map<string, AIInsight>();

  for (const insight of summaries) {
    const key = insight.period_start ?? "";
    if (!key) continue;

    const existing = byPeriod.get(key);
    if (!existing) {
      byPeriod.set(key, insight);
      continue;
    }

    if (existing.source !== "computed" && insight.source === "computed") {
      byPeriod.set(key, insight);
    }
  }

  return byPeriod;
}

function fillGapWeeks(dataByPeriod: Map<string, AIInsight>): WeekMoodData[] {
  if (dataByPeriod.size === 0) return [];

  const sortedKeys = Array.from(dataByPeriod.keys()).sort();
  const earliest = parseDateParts(sortedKeys[0]);
  const latest = parseDateParts(sortedKeys[sortedKeys.length - 1]);
  if (!earliest || !latest) return [];

  const weeks: WeekMoodData[] = [];
  const current = new Date(earliest);

  while (current <= latest) {
    const key = toISODate(current);
    const insight = dataByPeriod.get(key);

    if (insight) {
      const distribution = extractDistribution(insight);
      const total = Object.values(distribution).reduce((s, c) => s + c, 0);
      weeks.push({
        label: formatWeekLabel(key),
        distribution,
        total,
        hasData: total > 0,
      });
    } else {
      weeks.push({
        label: formatWeekLabel(key),
        distribution: {},
        total: 0,
        hasData: false,
      });
    }

    current.setTime(current.getTime() + MS_PER_WEEK);
  }

  return weeks.slice(-MAX_WEEKS_DISPLAYED);
}

function buildWeekData(summaries: readonly AIInsight[]): WeekMoodData[] {
  const dataByPeriod = deduplicateByPeriod(summaries);
  return fillGapWeeks(dataByPeriod);
}

function getActiveMoods(weeks: readonly WeekMoodData[]): MoodCategory[] {
  const seen = new Set<string>();
  for (const week of weeks) {
    for (const mood of Object.keys(week.distribution)) {
      seen.add(mood);
    }
  }
  return TRACKED_MOODS.filter((m) => seen.has(m));
}

function countWeeksWithData(weeks: readonly WeekMoodData[]): number {
  return weeks.filter((w) => w.hasData).length;
}

function computeMoodRatio(week: WeekMoodData, mood: MoodCategory): number {
  if (week.total === 0) return 0;
  return (week.distribution[mood] ?? 0) / week.total;
}

function computeChartPoints(
  weeks: readonly WeekMoodData[],
  mood: MoodCategory,
  drawableWidth: number,
  drawableHeight: number,
  stepX: number,
): ChartPoint[] {
  return weeks.map((week, i) => {
    const ratio = computeMoodRatio(week, mood);
    return {
      x: CHART_PADDING_LEFT + i * stepX,
      y: CHART_PADDING_TOP + drawableHeight * (1 - ratio),
      hasData: week.hasData,
    };
  });
}

export function MoodTrendChart({ insights }: MoodTrendChartProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [containerWidth, setContainerWidth] = useState(0);

  const summaries = useMemo(
    () => insights.filter((i) => i.insight_type === "weekly_summary"),
    [insights],
  );

  const weeks = useMemo(() => buildWeekData(summaries), [summaries]);
  const activeMoods = useMemo(() => getActiveMoods(weeks), [weeks]);
  const dataWeekCount = useMemo(() => countWeeksWithData(weeks), [weeks]);

  const handleLayout = (event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
  };

  if (dataWeekCount < MIN_WEEKS_FOR_TREND || activeMoods.length === 0) {
    return null;
  }

  if (weeks.length < 2) {
    return null;
  }

  const canvasWidth = containerWidth > 0 ? containerWidth : 300;
  const drawableWidth = canvasWidth - CHART_PADDING_LEFT - CHART_PADDING_RIGHT;
  const drawableHeight = CHART_HEIGHT - CHART_PADDING_TOP - CHART_PADDING_BOTTOM;
  const stepX = drawableWidth / (weeks.length - 1);

  return (
    <Card>
      <View style={styles.container} onLayout={handleLayout}>
        <AppText variant="h3" color={colors.textPrimary}>
          {t("insights.moodTrends")}
        </AppText>

        {containerWidth > 0 ? (
          <>
            <Canvas style={[styles.canvas, { width: canvasWidth }]}>
              {activeMoods.map((mood) => {
                const color = getMoodAccentColor(mood);
                const points = computeChartPoints(
                  weeks, mood, drawableWidth, drawableHeight, stepX,
                );

                return points.flatMap((point, i) => {
                  const elements: React.JSX.Element[] = [];

                  if (point.hasData) {
                    elements.push(
                      <Circle
                        key={`${mood}-dot-${i}`}
                        cx={point.x}
                        cy={point.y}
                        r={DOT_RADIUS}
                        color={color}
                      />,
                    );
                  }

                  if (i < points.length - 1) {
                    const next = points[i + 1];

                    if (point.hasData && next.hasData) {
                      elements.push(
                        <SkiaLine
                          key={`${mood}-line-${i}`}
                          p1={vec(point.x, point.y)}
                          p2={vec(next.x, next.y)}
                          color={withAlpha(color, LINE_OPACITY)}
                          strokeWidth={LINE_WIDTH}
                        />,
                      );
                    }
                  }

                  return elements;
                });
              })}
            </Canvas>

            <View style={styles.xAxis}>
              {weeks.map((week, i) => (
                <AppText
                  key={i}
                  variant="caption"
                  color={
                    week.hasData
                      ? colors.textTertiary
                      : withAlpha(colors.textTertiary, 0.5)
                  }
                  style={styles.xLabel}
                >
                  {week.label}
                </AppText>
              ))}
            </View>

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
          </>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  canvas: {
    height: CHART_HEIGHT,
    alignSelf: "center",
  },
  xAxis: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: CHART_PADDING_LEFT,
  },
  xLabel: {
    textAlign: "center",
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
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
