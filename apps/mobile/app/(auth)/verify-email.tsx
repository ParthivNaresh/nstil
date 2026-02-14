import { useRouter, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";

import { AuthFooterLink } from "@/components/auth";
import { AppText, Button, Card, ScreenContainer } from "@/components/ui";
import { useVerifyEmail } from "@/hooks";
import { useTheme } from "@/hooks/useTheme";
import { useAuthStore } from "@/stores/authStore";
import { spacing } from "@/styles";

export default function VerifyEmailScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const isEmailVerified = useAuthStore((s) => s.isEmailVerified);
  const signOut = useAuthStore((s) => s.signOut);
  const { cooldownRemaining, isResending, statusMessage, resend } =
    useVerifyEmail(email ?? "");

  useEffect(() => {
    if (isEmailVerified) {
      router.replace("/(tabs)");
    }
  }, [isEmailVerified, router]);

  const handleDifferentEmail = useCallback(async () => {
    await signOut();
    router.replace("/(auth)/sign-up");
  }, [signOut, router]);

  const resendButtonTitle =
    cooldownRemaining > 0
      ? t("auth.verifyEmail.resendCooldown", { seconds: cooldownRemaining })
      : t("auth.verifyEmail.resend");

  return (
    <ScreenContainer scrollable={false} centered ambient={false}>
      <View style={styles.content}>
        <View style={styles.header}>
          <AppText variant="h1">{t("auth.verifyEmail.title")}</AppText>
          <AppText variant="body" color={colors.textSecondary} align="center">
            {t("auth.verifyEmail.subtitle")}
          </AppText>
          {email ? (
            <AppText variant="body" color={colors.accent} style={styles.email}>
              {email}
            </AppText>
          ) : null}
        </View>

        <Card style={styles.card}>
          <Button
            title={resendButtonTitle}
            onPress={resend}
            variant="primary"
            loading={isResending}
            disabled={cooldownRemaining > 0 || isResending}
          />

          {statusMessage ? (
            <AppText variant="bodySmall" color={colors.success} align="center">
              {statusMessage}
            </AppText>
          ) : null}

          <Button
            title={t("auth.verifyEmail.differentEmail")}
            onPress={handleDifferentEmail}
            variant="ghost"
          />
        </Card>

        <AuthFooterLink
          prompt={t("auth.verifyEmail.alreadyVerified")}
          linkText={t("auth.signIn.submit")}
          href="/(auth)/sign-in"
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    gap: spacing.xl,
  },
  header: {
    alignItems: "center",
    gap: spacing.sm,
  },
  email: {
    fontWeight: "600",
  },
  card: {
    gap: spacing.md,
  },
});
