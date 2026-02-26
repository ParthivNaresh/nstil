import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { useTranslation } from "react-i18next";

import { Greeting, HomeCheckInSection, JournalListCard, MoodSnapshotStrip, StreakBanner } from "@/components/home";
import { Header } from "@/components/ui";
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

  const { data: profile } = useProfile();
  const { streak } = useCalendarRange();
  const { data: journals = [] } = useJournals();

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

  return (
    <View style={styles.root}>
      <Header title={t("home.title")} />
      <ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: headerHeight + spacing.xl,
            paddingBottom: tabBarHeight + spacing.md,
          },
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
        <Greeting displayName={profile?.display_name ?? null} />
        <MoodSnapshotStrip />
        {streak > 0 ? <StreakBanner streak={streak} /> : null}
        {journals.length > 0 ? (
          <JournalListCard
            journals={journals}
            label={t("home.myJournals")}
            actionLabel={t("home.viewAll")}
          />
        ) : null}
        <HomeCheckInSection />
      </ScrollView>
    </View>
  );
}
