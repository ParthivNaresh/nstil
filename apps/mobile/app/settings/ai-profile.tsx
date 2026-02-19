import { useRouter } from "expo-router";
import { useCallback } from "react";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AIProfileSettings } from "@/components/settings";
import { Header, ScreenContainer, Skeleton } from "@/components/ui";
import { useAIProfile } from "@/hooks/useAIProfile";
import { useHeaderHeight } from "@/hooks/useHeaderHeight";
import { spacing } from "@/styles";

export default function AIProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const headerHeight = useHeaderHeight();
  const { data: profile, isLoading } = useAIProfile();

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <ScreenContainer>
      <Header
        title={t("settings.aiProfile.title")}
        onBack={handleBack}
      />
      <View style={[styles.content, { paddingTop: headerHeight + spacing.md }]}>
        {isLoading ? (
          <View style={styles.skeletons}>
            <Skeleton width="100%" height={60} shape="rect" />
            <Skeleton width="100%" height={120} shape="rect" />
            <Skeleton width="100%" height={160} shape="rect" />
          </View>
        ) : null}

        {profile ? (
          <AIProfileSettings profile={profile} />
        ) : null}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  skeletons: {
    gap: spacing.md,
  },
});
