import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";

import { ThemePicker } from "@/components/settings";
import { AppText, Avatar, Button, Card, Divider, ScreenContainer } from "@/components/ui";
import { useTheme } from "@/hooks/useTheme";
import { useAuthStore } from "@/stores/authStore";
import { spacing } from "@/styles";

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { colors, mode, setMode } = useTheme();
  const router = useRouter();
  const signOut = useAuthStore((s) => s.signOut);
  const session = useAuthStore((s) => s.session);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const userEmail = session?.user?.email ?? "";

  const handleSignOut = useCallback(async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      router.replace("/(auth)");
    } catch {
      setIsSigningOut(false);
    }
  }, [signOut, router]);

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
});
