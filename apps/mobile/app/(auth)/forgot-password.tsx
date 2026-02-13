import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";

import { AuthFooterLink } from "@/components/auth";
import { AppText, Button, Card, ScreenContainer, TextInput } from "@/components/ui";
import { useForgotPassword } from "@/hooks";
import { colors, spacing } from "@/styles";

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
            <AppText variant="h1">
              {t("auth.forgotPassword.successTitle")}
            </AppText>
            <AppText variant="body" color={colors.textSecondary} align="center">
              {t("auth.forgotPassword.successSubtitle")}
            </AppText>
            <AppText variant="body" color={colors.accent} style={styles.email}>
              {email.value.trim()}
            </AppText>
          </View>

          <Card style={styles.card}>
            <Button
              title={resendTitle}
              onPress={resend}
              variant="primary"
              loading={isLoading}
              disabled={cooldownRemaining > 0 || isLoading}
            />

            {statusMessage ? (
              <AppText variant="bodySmall" color={colors.success} align="center">
                {statusMessage}
              </AppText>
            ) : null}
          </Card>

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
          <AppText variant="h1">{t("auth.forgotPassword.title")}</AppText>
          <AppText variant="body" color={colors.textSecondary} align="center">
            {t("auth.forgotPassword.subtitle")}
          </AppText>
        </View>

        <Card style={styles.card}>
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
            <AppText variant="bodySmall" color={colors.error} align="center">
              {statusMessage}
            </AppText>
          ) : null}
        </Card>

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
  email: {
    fontWeight: "600",
  },
  card: {
    gap: spacing.lg,
  },
});
