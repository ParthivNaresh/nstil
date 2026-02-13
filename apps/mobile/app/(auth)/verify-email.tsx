import { useRouter, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

import { AuthFooterLink } from "@/components/auth";
import { Button, GlassCard, ScreenContainer } from "@/components/ui";
import { useVerifyEmail } from "@/hooks";
import { useAuthStore } from "@/stores/authStore";
import { colors, spacing, typography } from "@/styles";

export default function VerifyEmailScreen() {
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
    <ScreenContainer scrollable={false} centered>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{t("auth.verifyEmail.title")}</Text>
          <Text style={styles.subtitle}>{t("auth.verifyEmail.subtitle")}</Text>
          {email ? <Text style={styles.email}>{email}</Text> : null}
        </View>

        <GlassCard style={styles.card}>
          <Button
            title={resendButtonTitle}
            onPress={resend}
            variant="primary"
            loading={isResending}
            disabled={cooldownRemaining > 0 || isResending}
          />

          {statusMessage ? (
            <Text style={styles.statusMessage}>{statusMessage}</Text>
          ) : null}

          <Button
            title={t("auth.verifyEmail.differentEmail")}
            onPress={handleDifferentEmail}
            variant="ghost"
          />
        </GlassCard>

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
  title: {
    ...typography.h1,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
  },
  email: {
    ...typography.body,
    color: colors.accent,
    fontWeight: "600",
    textAlign: "center",
  },
  card: {
    gap: spacing.md,
  },
  statusMessage: {
    ...typography.bodySmall,
    color: colors.success,
    textAlign: "center",
  },
});
