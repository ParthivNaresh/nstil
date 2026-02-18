import {
  Canvas,
  Circle,
  Line as SkiaLine,
  vec,
} from "@shopify/react-native-skia";
import { useMemo } from "react";
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
  readonly distribution: Record<string, number>;
  readonly total: number;
}

const CHART_HEIGHT = 160;
const CHART_PADDING_LEFT = 8;
const CHART_PADDING_RIGHT = 8;
const CHART_PADDING_TOP = 16;
const CHART_PADDING_BOTTOM = 28;
const DOT_RADIUS = 4;
const LINE_WIDTH = 2;

const TRACKED_MOODS: readonly MoodCategory[] = ["happy", "calm", "sad", "anxious", "angry"];

function extractWeekLabel(periodStart: string | null): string {
  if (!periodStart) return "";
  const d = new Date(periodStart);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function extractDistribution(insight: AIInsight): Record<string, number> {
  const raw = insight.metadata.mood_distribution;
  if (typeof raw === "object" && raw !== null && !Array.isArray(raw)) {
    return raw as Record<string, number>;
  }
  return {};
}

export function MoodTrendChart({ insights }: MoodTrendChartProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const weeks = useMemo((): WeekMoodData[] => {
    return insights
      .filter((i) => i.insight_type === "weekly_summary")
      .sort((a, b) => (a.period_start ?? "").localeCompare(b.period_start ?? ""))
      .slice(-4)
      .map((insight) => {
        const distribution = extractDistribution(insight);
        const total = Object.values(distribution).reduce((s, c) => s + c, 0);
        return {
          label: extractWeekLabel(insight.period_start),
          distribution,
          total,
        };
      });
  }, [insights]);

  const activeMoods = useMemo((): MoodCategory[] => {
    const seen = new Set<string>();
    for (const week of weeks) {
      for (const mood of Object.keys(week.distribution)) {
        seen.add(mood);
      }
    }
    return TRACKED_MOODS.filter((m) => seen.has(m));
  }, [weeks]);

  if (weeks.length < 2 || activeMoods.length === 0) {
    return null;
  }

  const drawableWidth = 300 - CHART_PADDING_LEFT - CHART_PADDING_RIGHT;
  const drawableHeight = CHART_HEIGHT - CHART_PADDING_TOP - CHART_PADDING_BOTTOM;
  const stepX = drawableWidth / (weeks.length - 1);

  return (
    <Card>
      <View style={styles.container}>
        <AppText variant="h3" color={colors.textPrimary}>
          {t("insights.moodTrends")}
        </AppText>

        <Canvas style={styles.canvas}>
          {activeMoods.map((mood) => {
            const color = getMoodAccentColor(mood);
            const points = weeks.map((week, i) => {
              const ratio = week.total > 0
                ? (week.distribution[mood] ?? 0) / week.total
                : 0;
              return {
                x: CHART_PADDING_LEFT + i * stepX,
                y: CHART_PADDING_TOP + drawableHeight * (1 - ratio),
              };
            });

            return points.map((point, i) => {
              const elements = [
                <Circle
                  key={`${mood}-dot-${i}`}
                  cx={point.x}
                  cy={point.y}
                  r={DOT_RADIUS}
                  color={color}
                />,
              ];

              if (i < points.length - 1) {
                const next = points[i + 1];
                elements.push(
                  <SkiaLine
                    key={`${mood}-line-${i}`}
                    p1={vec(point.x, point.y)}
                    p2={vec(next.x, next.y)}
                    color={withAlpha(color, 0.6)}
                    strokeWidth={LINE_WIDTH}
                  />,
                );
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
              color={colors.textTertiary}
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
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  canvas: {
    width: 300,
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
