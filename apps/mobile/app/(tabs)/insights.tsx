import { Lightbulb } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import {
  InsightCard,
  MoodAnomalyCard,
  MoodTrendChart,
  StreakBanner,
  WeeklySummaryCard,
  YearInPixels,
} from "@/components/insights";
import { EmptyState, Header, Skeleton } from "@/components/ui";
import {
  useGenerateInsights,
  useHeaderHeight,
  useInsightsList,
  useTheme,
  useUpdateInsight,
  useYearCalendar,
} from "@/hooks";
import {
  parseMoodAnomalyData,
  parseStreakData,
  parseWeeklySummaryData,
} from "@/lib/insightUtils";
import { queryClient } from "@/lib/queryClient";
import { queryKeys } from "@/lib/queryKeys";
import { spacing } from "@/styles";
import type { AIInsight } from "@/types";

import { styles } from "@/styles/screens/insightsStyles";

const CURRENT_YEAR = new Date().getFullYear();

export default function InsightsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const headerHeight = useHeaderHeight();
  const [refreshing, setRefreshing] = useState(false);
  const hasGenerated = useRef(false);

  const { mutate: generate } = useGenerateInsights();
  const { data: insightsResponse, isLoading: insightsLoading } = useInsightsList();
  const { mutate: updateInsight } = useUpdateInsight();
  const { days: yearDays, isLoading: yearLoading } = useYearCalendar(CURRENT_YEAR);

  useEffect(() => {
    if (!hasGenerated.current) {
      hasGenerated.current = true;
      generate();
    }
  }, [generate]);

  const insights = useMemo(
    () => insightsResponse?.items ?? [],
    [insightsResponse?.items],
  );

  const { streakInsight, weeklySummaryInsight, anomalyInsight, otherInsights } =
    useMemo(() => {
      let streak: AIInsight | null = null;
      let weekly: AIInsight | null = null;
      let anomaly: AIInsight | null = null;
      const others: AIInsight[] = [];

      for (const insight of insights) {
        if (insight.status === "dismissed") continue;

        switch (insight.insight_type) {
          case "streak_milestone":
            if (!streak) streak = insight;
            break;
          case "weekly_summary":
            if (!weekly) weekly = insight;
            break;
          case "anomaly":
            if (!anomaly) anomaly = insight;
            break;
          default:
            others.push(insight);
        }
      }

      return {
        streakInsight: streak,
        weeklySummaryInsight: weekly,
        anomalyInsight: anomaly,
        otherInsights: others,
      };
    }, [insights]);

  const streakData = useMemo(
    () => (streakInsight ? parseStreakData(streakInsight) : null),
    [streakInsight],
  );

  const weeklySummaryData = useMemo(
    () => (weeklySummaryInsight ? parseWeeklySummaryData(weeklySummaryInsight) : null),
    [weeklySummaryInsight],
  );

  const anomalyData = useMemo(
    () => (anomalyInsight ? parseMoodAnomalyData(anomalyInsight) : null),
    [anomalyInsight],
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    generate();
    await queryClient.invalidateQueries({ queryKey: queryKeys.insights.all });
    setRefreshing(false);
  }, [generate]);

  const handleDismiss = useCallback(
    (id: string) => {
      updateInsight({ id, data: { status: "dismissed" } });
    },
    [updateInsight],
  );

  const handleBookmark = useCallback(
    (id: string) => {
      const insight = insights.find((i) => i.id === id);
      const newStatus = insight?.status === "bookmarked" ? "seen" : "bookmarked";
      updateInsight({ id, data: { status: newStatus } });
    },
    [insights, updateInsight],
  );

  const handleDayPress = useCallback(
    (dateString: string) => {
      router.push(`/(tabs)/history?date=${dateString}`);
    },
    [router],
  );

  const isLoading = insightsLoading && insights.length === 0;
  const isEmpty = !isLoading && insights.length === 0;

  return (
    <View style={styles.root}>
      <Header title={t("insights.title")} />
      <ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: headerHeight + spacing.xl },
          isEmpty ? styles.emptyContainer : undefined,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.textTertiary}
          />
        }
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Skeleton shape="rect" height={80} />
            <Skeleton shape="rect" height={200} />
            <Skeleton shape="rect" height={120} />
          </View>
        ) : isEmpty ? (
          <EmptyState
            icon={Lightbulb}
            title={t("insights.emptyTitle")}
            subtitle={t("insights.emptySubtitle")}
          />
        ) : (
          <>
            {streakData ? (
              <StreakBanner data={streakData} />
            ) : null}

            {weeklySummaryData ? (
              <WeeklySummaryCard data={weeklySummaryData} />
            ) : null}

            {anomalyInsight && anomalyData ? (
              <MoodAnomalyCard insight={anomalyInsight} data={anomalyData} />
            ) : null}

            <MoodTrendChart insights={insights} />

            {!yearLoading && yearDays.length > 0 ? (
              <YearInPixels days={yearDays} onDayPress={handleDayPress} />
            ) : null}

            {otherInsights.map((insight) => (
              <InsightCard
                key={insight.id}
                insight={insight}
                onDismiss={handleDismiss}
                onBookmark={handleBookmark}
              />
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}
