import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppText, Card } from "@/components/ui";
import { useTheme } from "@/hooks/useTheme";
import { formatPeriodLabel } from "@/lib/insightUtils";
import type { WeeklySummaryData } from "@/lib/insightUtils";
import { spacing } from "@/styles";

import { MoodBar } from "./MoodBar";

interface WeeklySummaryCardProps {
  readonly data: WeeklySummaryData;
}

export function WeeklySummaryCard({ data }: WeeklySummaryCardProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const periodLabel = useMemo(
    () => formatPeriodLabel(data.periodStart, data.periodEnd),
    [data.periodStart, data.periodEnd],
  );

  const hasMoodData = Object.keys(data.moodDistribution).length > 0;

  return (
    <Card>
      <View style={styles.container}>
        <View style={styles.header}>
          <AppText variant="h3" color={colors.textPrimary}>
            {t("insights.weeklySummary")}
          </AppText>
          {periodLabel ? (
            <AppText variant="caption" color={colors.textTertiary}>
              {periodLabel}
            </AppText>
          ) : null}
        </View>

        <View style={styles.stats}>
          <StatItem
            label={t("insights.entries")}
            value={String(data.entryCount)}
            color={colors.textPrimary}
            labelColor={colors.textSecondary}
          />
          <StatItem
            label={t("insights.avgLength")}
            value={data.avgEntryLength > 0 ? String(data.avgEntryLength) : "—"}
            color={colors.textPrimary}
            labelColor={colors.textSecondary}
          />
        </View>

        {hasMoodData ? (
          <MoodBar distribution={data.moodDistribution} />
        ) : null}

        {data.topTags.length > 0 ? (
          <View style={styles.tags}>
            <AppText variant="caption" color={colors.textTertiary}>
              {t("insights.topThemes")}
            </AppText>
            <AppText variant="bodySmall" color={colors.textSecondary}>
              {data.topTags.join(", ")}
            </AppText>
          </View>
        ) : null}
      </View>
    </Card>
  );
}

interface StatItemProps {
  readonly label: string;
  readonly value: string;
  readonly color: string;
  readonly labelColor: string;
}

function StatItem({ label, value, color, labelColor }: StatItemProps) {
  return (
    <View style={styles.statItem}>
      <AppText variant="h2" color={color}>
        {value}
      </AppText>
      <AppText variant="caption" color={labelColor}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  stats: {
    flexDirection: "row",
    gap: spacing.xl,
  },
  statItem: {
    gap: spacing.xs,
  },
  tags: {
    gap: spacing.xs,
  },
});
