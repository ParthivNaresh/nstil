import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";

import { AppText, Avatar, Button, ScreenContainer } from "@/components/ui";
import { useAuthStore } from "@/stores/authStore";
import { colors, spacing } from "@/styles";

export default function SettingsScreen() {
  const { t } = useTranslation();
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
    <ScreenContainer centered>
      <View style={styles.content}>
        <Avatar email={userEmail} size="lg" />
        <AppText variant="h2">{t("tabs.settings")}</AppText>
        <AppText variant="bodySmall" color={colors.textSecondary}>
          {userEmail}
        </AppText>
        <View style={styles.signOutContainer}>
          <Button
            title={t("home.signOut")}
            onPress={handleSignOut}
            variant="secondary"
            loading={isSigningOut}
            disabled={isSigningOut}
          />
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  signOutContainer: {
    marginTop: spacing.xl,
    width: "100%",
  },
});
