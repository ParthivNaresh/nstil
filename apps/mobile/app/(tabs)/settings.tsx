import { useRouter } from "expo-router";
import { Bell, Sparkles } from "lucide-react-native";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";

import { ThemePicker } from "@/components/settings";
import { AppText, Avatar, Button, Card, Divider, Icon, ScreenContainer } from "@/components/ui";
import { useTheme } from "@/hooks/useTheme";
import { useAuthStore } from "@/stores/authStore";
import { useNotificationStore } from "@/stores/notificationStore";
import { spacing } from "@/styles";

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { colors, mode, setMode } = useTheme();
  const router = useRouter();
  const signOut = useAuthStore((s) => s.signOut);
  const clearScheduled = useNotificationStore((s) => s.clearScheduled);
  const session = useAuthStore((s) => s.session);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const userEmail = session?.user?.email ?? "";

  const handleSignOut = useCallback(async () => {
    setIsSigningOut(true);
    try {
      await clearScheduled();
      await signOut();
      router.replace("/(auth)");
    } catch {
      setIsSigningOut(false);
    }
  }, [signOut, clearScheduled, router]);

  const handleNotifications = useCallback(() => {
    router.push("/settings/notifications");
  }, [router]);

  const handleAIProfile = useCallback(() => {
    router.push("/settings/ai-profile");
  }, [router]);

  return (
    <ScreenContainer>
      <View style={styles.content}>
        <View style={styles.profile}>
          <Avatar email={userEmail} size="lg" />
          <AppText variant="h2">{t("tabs.settings")}</AppText>
          <AppText variant="bodySmall" color={colors.textSecondary}>
            {userEmail}
          </AppText>
        </View>

        <Card>
          <ThemePicker currentMode={mode} onSelect={setMode} />
        </Card>

        <Card
          onPress={handleNotifications}
          showChevron
        >
          <View style={styles.menuRow}>
            <Icon icon={Bell} size="md" color={colors.accent} />
            <View style={styles.menuText}>
              <AppText variant="label">
                {t("settings.notifications.title")}
              </AppText>
              <AppText variant="caption" color={colors.textTertiary}>
                {t("settings.notifications.subtitle")}
              </AppText>
            </View>
          </View>
        </Card>

        <Card
          onPress={handleAIProfile}
          showChevron
        >
          <View style={styles.menuRow}>
            <Icon icon={Sparkles} size="md" color={colors.accent} />
            <View style={styles.menuText}>
              <AppText variant="label">
                {t("settings.aiProfile.title")}
              </AppText>
              <AppText variant="caption" color={colors.textTertiary}>
                {t("settings.aiProfile.subtitle")}
              </AppText>
            </View>
          </View>
        </Card>

        <Divider />

        <Button
          title={t("home.signOut")}
          onPress={handleSignOut}
          variant="secondary"
          loading={isSigningOut}
          disabled={isSigningOut}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    gap: spacing.lg,
  },
  profile: {
    alignItems: "center",
    gap: spacing.sm,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  menuText: {
    flex: 1,
    gap: 2,
  },
});
