import { useRouter } from "expo-router";
import { useCallback } from "react";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import {
  NotificationPermissionCard,
  NotificationSettings,
} from "@/components/settings";
import { Header, ScreenContainer, Skeleton } from "@/components/ui";
import { useNotificationPreferences } from "@/hooks/useNotificationPreferences";
import { useHeaderHeight } from "@/hooks/useHeaderHeight";
import { PermissionStatus } from "@/lib/notifications";
import { useNotificationStore } from "@/stores/notificationStore";
import { spacing } from "@/styles";

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const headerHeight = useHeaderHeight();
  const permissionStatus = useNotificationStore((s) => s.permissionStatus);
  const { data: preferences, isLoading } = useNotificationPreferences();

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const isGranted = permissionStatus === PermissionStatus.GRANTED;

  return (
    <ScreenContainer>
      <Header
        title={t("settings.notifications.title")}
        onBack={handleBack}
      />
      <View style={[styles.content, { paddingTop: headerHeight + spacing.md }]}>
        {!isGranted ? (
          <NotificationPermissionCard status={permissionStatus} />
        ) : null}

        {isGranted && isLoading ? (
          <View style={styles.skeletons}>
            <Skeleton width="100%" height={60} shape="rect" />
            <Skeleton width="100%" height={120} shape="rect" />
            <Skeleton width="100%" height={180} shape="rect" />
          </View>
        ) : null}

        {isGranted && preferences ? (
          <NotificationSettings preferences={preferences} />
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
