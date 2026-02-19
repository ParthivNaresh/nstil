import { Bell, ExternalLink } from "lucide-react-native";
import { useCallback } from "react";
import { Linking, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppText, Button, Card, Icon } from "@/components/ui";
import { useTheme } from "@/hooks/useTheme";
import { PermissionStatus, type NotificationPermissionStatus } from "@/lib/notifications";
import { useNotificationStore } from "@/stores/notificationStore";
import { spacing } from "@/styles";

interface NotificationPermissionCardProps {
  readonly status: NotificationPermissionStatus;
}

export function NotificationPermissionCard({ status }: NotificationPermissionCardProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const requestPermission = useNotificationStore((s) => s.requestPermission);

  const handleEnable = useCallback(async () => {
    await requestPermission();
  }, [requestPermission]);

  const handleOpenSettings = useCallback(() => {
    void Linking.openSettings();
  }, []);

  if (status === PermissionStatus.GRANTED) {
    return null;
  }

  const isDenied = status === PermissionStatus.DENIED;

  return (
    <Card>
      <View style={styles.container}>
        <View style={[styles.iconContainer, { backgroundColor: colors.accentMuted }]}>
          <Icon icon={Bell} size="lg" color={colors.accent} />
        </View>
        <AppText variant="h3" align="center">
          {t("settings.notifications.permission.title")}
        </AppText>
        <AppText variant="bodySmall" color={colors.textSecondary} align="center">
          {isDenied
            ? t("settings.notifications.permission.denied")
            : t("settings.notifications.permission.subtitle")}
        </AppText>
        {isDenied ? (
          <Button
            title={t("settings.notifications.permission.openSettings")}
            onPress={handleOpenSettings}
            variant="secondary"
            icon={<Icon icon={ExternalLink} size="sm" color={colors.textPrimary} />}
          />
        ) : (
          <Button
            title={t("settings.notifications.permission.enable")}
            onPress={handleEnable}
          />
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
});
