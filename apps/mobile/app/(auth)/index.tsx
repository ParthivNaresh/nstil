import { useRouter } from "expo-router";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";

import { AppText, Button, Card, ScreenContainer } from "@/components/ui";
import { useTheme } from "@/hooks/useTheme";
import { spacing } from "@/styles";

export default function WelcomeScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();

  const navigateToSignIn = useCallback(() => {
    router.push("/(auth)/sign-in");
  }, [router]);

  const navigateToSignUp = useCallback(() => {
    router.push("/(auth)/sign-up");
  }, [router]);

  return (
    <ScreenContainer scrollable={false} centered ambient={false}>
      <View style={styles.content}>
        <View style={styles.branding}>
          <AppText variant="h1" style={styles.title}>
            {t("auth.welcome.title")}
          </AppText>
          <AppText variant="body" color={colors.textSecondary} align="center">
            {t("auth.welcome.subtitle")}
          </AppText>
        </View>

        <Card style={styles.card}>
          <View style={styles.actions}>
            <Button
              title={t("auth.welcome.signIn")}
              onPress={navigateToSignIn}
              variant="primary"
            />
            <Button
              title={t("auth.welcome.signUp")}
              onPress={navigateToSignUp}
              variant="secondary"
            />
          </View>
        </Card>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    gap: spacing["3xl"],
  },
  branding: {
    alignItems: "center",
    gap: spacing.sm,
  },
  title: {
    fontSize: 48,
    fontWeight: "700",
    letterSpacing: -1,
  },
  card: {
    gap: spacing.md,
  },
  actions: {
    gap: spacing.md,
  },
});
