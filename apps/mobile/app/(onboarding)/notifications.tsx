import { Bell } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useCallback } from "react";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { OnboardingStep } from "@/components/onboarding";
import { AppText, Button, Icon } from "@/components/ui";
import { useTheme } from "@/hooks/useTheme";
import { useCompleteOnboarding } from "@/hooks/useProfile";
import { useNotificationStore } from "@/stores/notificationStore";
import { spacing } from "@/styles";

const TOTAL_STEPS = 4;
const ICON_CONTAINER_SIZE = 72;

export default function NotificationsStep() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const requestPermission = useNotificationStore((s) => s.requestPermission);
  const { mutateAsync: completeOnboarding, isPending } = useCompleteOnboarding();

  const finishOnboarding = useCallback(async () => {
    await completeOnboarding();
    router.replace("/(tabs)");
  }, [completeOnboarding, router]);

  const handleEnable = useCallback(async () => {
    await requestPermission();
    await finishOnboarding();
  }, [requestPermission, finishOnboarding]);

  const handleSkip = useCallback(async () => {
    await finishOnboarding();
  }, [finishOnboarding]);

  return (
    <OnboardingStep
      step={3}
      totalSteps={TOTAL_STEPS}
      title={t("onboarding.notifications.title")}
      subtitle={t("onboarding.notifications.subtitle")}
      footer={
        <View style={styles.footer}>
          <Button
            title={t("onboarding.notifications.enable")}
            onPress={handleEnable}
            loading={isPending}
            disabled={isPending}
          />
          <Button
            title={t("onboarding.notifications.skip")}
            onPress={handleSkip}
            variant="ghost"
            disabled={isPending}
          />
        </View>
      }
    >
      <View style={styles.iconSection}>
        <View style={[styles.iconContainer, { backgroundColor: colors.accentMuted }]}>
          <Icon icon={Bell} size="xl" color={colors.accent} />
        </View>
        <AppText variant="bodySmall" color={colors.textTertiary} align="center">
          {t("settings.notifications.permission.subtitle")}
        </AppText>
      </View>
    </OnboardingStep>
  );
}

const styles = StyleSheet.create({
  iconSection: {
    alignItems: "center",
    gap: spacing.lg,
  },
  iconContainer: {
    width: ICON_CONTAINER_SIZE,
    height: ICON_CONTAINER_SIZE,
    borderRadius: ICON_CONTAINER_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    gap: spacing.sm,
  },
});
