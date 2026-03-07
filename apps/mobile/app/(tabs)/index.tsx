import { useQueryClient } from "@tanstack/react-query";
import { WifiOff } from "lucide-react-native";
import { useCallback, useState } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { useTranslation } from "react-i18next";

import { BreathingCard, DriftCard, Greeting, HomeCheckInSection, JournalListCard, MoodSnapshotStrip, StreakBanner } from "@/components/home";
import { EmptyState, Header, Skeleton } from "@/components/ui";
import {
  useCalendarRange,
  useHeaderHeight,
  useJournals,
  useProfile,
  useTabBarHeight,
  useTheme,
} from "@/hooks";
import { queryKeys } from "@/lib/queryKeys";
import { spacing } from "@/styles";

import { styles } from "@/styles/screens/homeStyles";

export default function HomeScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useTabBarHeight();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const { data: profile, isLoading: profileLoading, isError: profileError, refetch: refetchProfile } = useProfile();
  const { streak } = useCalendarRange();
  const { data: journals, isError: journalsError, refetch: refetchJournals } = useJournals();

  const isFirstLoad = profileLoading && !profile;
  const isError = profileError && journalsError;

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.prompts.generated() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.entries.calendars() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.entries.lists() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.all }),
    ]);
    setRefreshing(false);
  }, [queryClient]);

  const handleRetry = useCallback(async () => {
    await Promise.all([refetchProfile(), refetchJournals()]);
  }, [refetchProfile, refetchJournals]);

  const contentPadding = {
    paddingTop: headerHeight + spacing.xl,
    paddingBottom: tabBarHeight + spacing.md,
  };

  return (
    <View style={styles.root}>
      <Header title={t("home.title")} />
      <ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.scrollContent,
          contentPadding,
          (isFirstLoad || isError) && styles.centeredContent,
        ]}
        showsVerticalScrollIndicator={false}
        alwaysBounceVertical
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.textTertiary}
          />
        }
      >
        {isFirstLoad ? (
          <View style={styles.loadingContainer}>
            <Skeleton shape="text" width="60%" height={28} />
            <Skeleton shape="rect" height={60} />
            <Skeleton shape="rect" height={120} />
            <Skeleton shape="rect" height={80} />
          </View>
        ) : isError ? (
          <EmptyState
            icon={WifiOff}
            title={t("common.error.connectionTitle")}
            subtitle={t("common.error.connectionSubtitle")}
            actionLabel={t("common.tryAgain")}
            onAction={handleRetry}
          />
        ) : (
          <>
            <Greeting displayName={profile?.display_name ?? null} />
            <MoodSnapshotStrip />
            {streak > 0 ? <StreakBanner streak={streak} /> : null}
            {(journals ?? []).length > 0 ? (
              <JournalListCard
                journals={journals ?? []}
                label={t("home.myJournals")}
                actionLabel={t("home.viewAll")}
              />
            ) : null}
            <HomeCheckInSection />
            <BreathingCard />
            <DriftCard />
          </>
        )}
      </ScrollView>
    </View>
  );
}
