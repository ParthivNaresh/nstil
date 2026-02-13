import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

import { AuthFooterLink } from "@/components/auth";
import { Button, GlassCard, ScreenContainer, TextInput } from "@/components/ui";
import { useForgotPassword } from "@/hooks";
import { colors, spacing, typography } from "@/styles";

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const {
    email,
    isLoading,
    isSent,
    cooldownRemaining,
    statusMessage,
    handleSubmit,
    resend,
  } = useForgotPassword();

  if (isSent) {
    const resendTitle =
      cooldownRemaining > 0
        ? t("auth.forgotPassword.resendCooldown", { seconds: cooldownRemaining })
        : t("auth.forgotPassword.resend");

    return (
      <ScreenContainer scrollable={false} centered>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {t("auth.forgotPassword.successTitle")}
            </Text>
            <Text style={styles.subtitle}>
              {t("auth.forgotPassword.successSubtitle")}
            </Text>
            <Text style={styles.email}>{email.value.trim()}</Text>
          </View>

          <GlassCard style={styles.card}>
            <Button
              title={resendTitle}
              onPress={resend}
              variant="primary"
              loading={isLoading}
              disabled={cooldownRemaining > 0 || isLoading}
            />

            {statusMessage ? (
              <Text style={styles.statusMessage}>{statusMessage}</Text>
            ) : null}
          </GlassCard>

          <AuthFooterLink
            prompt=""
            linkText={t("auth.forgotPassword.backToSignIn")}
            href="/(auth)/sign-in"
          />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scrollable={false} centered>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{t("auth.forgotPassword.title")}</Text>
          <Text style={styles.subtitle}>
            {t("auth.forgotPassword.subtitle")}
          </Text>
        </View>

        <GlassCard style={styles.card}>
          <TextInput
            label={t("auth.forgotPassword.email")}
            value={email.value}
            onChangeText={email.onChange}
            error={email.error}
            keyboardType="email-address"
            autoComplete="email"
            returnKeyType="go"
            onSubmitEditing={handleSubmit}
          />

          <Button
            title={t("auth.forgotPassword.submit")}
            onPress={handleSubmit}
            loading={isLoading}
            disabled={isLoading}
          />

          {statusMessage ? (
            <Text style={styles.errorMessage}>{statusMessage}</Text>
          ) : null}
        </GlassCard>

        <AuthFooterLink
          prompt=""
          linkText={t("auth.forgotPassword.backToSignIn")}
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
    gap: spacing.lg,
  },
  statusMessage: {
    ...typography.bodySmall,
    color: colors.success,
    textAlign: "center",
  },
  errorMessage: {
    ...typography.bodySmall,
    color: colors.error,
    textAlign: "center",
  },
});
