import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { useTranslation } from "react-i18next";

import { HomeCheckInSection } from "@/components/home";
import { Header } from "@/components/ui";
import { useHeaderHeight, useTheme } from "@/hooks";
import { queryKeys } from "@/lib/queryKeys";
import { spacing } from "@/styles";

import { styles } from "@/styles/screens/homeStyles";

export default function HomeScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const headerHeight = useHeaderHeight();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: queryKeys.prompts.generated() });
    setRefreshing(false);
  }, [queryClient]);

  return (
    <View style={styles.root}>
      <Header title={t("home.title")} />
      <ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: headerHeight + spacing.xl },
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
        <HomeCheckInSection />
      </ScrollView>
    </View>
  );
}
