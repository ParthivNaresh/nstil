import { useRouter } from "expo-router";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

import { Button, GlassCard, ScreenContainer } from "@/components/ui";
import { colors, spacing, typography } from "@/styles";

export default function WelcomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const navigateToSignIn = useCallback(() => {
    router.push("/(auth)/sign-in");
  }, [router]);

  const navigateToSignUp = useCallback(() => {
    router.push("/(auth)/sign-up");
  }, [router]);

  return (
    <ScreenContainer scrollable={false} centered>
      <View style={styles.content}>
        <View style={styles.branding}>
          <Text style={styles.title}>{t("auth.welcome.title")}</Text>
          <Text style={styles.subtitle}>{t("auth.welcome.subtitle")}</Text>
        </View>

        <GlassCard style={styles.card}>
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
        </GlassCard>
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
    ...typography.h1,
    color: colors.textPrimary,
    fontSize: 48,
    fontWeight: "700",
    letterSpacing: -1,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
  },
  card: {
    gap: spacing.md,
  },
  actions: {
    gap: spacing.md,
  },
});
