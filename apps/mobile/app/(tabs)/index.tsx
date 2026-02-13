import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

import { Button, ScreenContainer } from "@/components/ui";
import { useAuthStore } from "@/stores/authStore";
import { colors, spacing, typography } from "@/styles";

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const signOut = useAuthStore((s) => s.signOut);
  const session = useAuthStore((s) => s.session);
  const [isSigningOut, setIsSigningOut] = useState(false);

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
        <Text style={styles.title}>{t("home.title")}</Text>
        <Text style={styles.subtitle}>
          {session?.user?.email ?? t("home.authenticated")}
        </Text>
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
    gap: spacing.md,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  signOutContainer: {
    marginTop: spacing.xl,
    width: "100%",
  },
});
