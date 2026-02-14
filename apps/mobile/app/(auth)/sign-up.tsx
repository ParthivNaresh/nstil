import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, TextInput as RNTextInput, View } from "react-native";

import { AuthFooterLink, AuthHeader, FormError } from "@/components/auth";
import { AppText, Button, Card, ScreenContainer, TextInput } from "@/components/ui";
import { useSignUpForm } from "@/hooks";
import { useTheme } from "@/hooks/useTheme";
import { spacing } from "@/styles";

export default function SignUpScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const {
    email,
    password,
    confirmPassword,
    isLoading,
    formError,
    handleSubmit,
  } = useSignUpForm();
  const passwordRef = useRef<RNTextInput>(null);
  const confirmPasswordRef = useRef<RNTextInput>(null);

  return (
    <ScreenContainer ambient={false}>
      <View style={styles.content}>
        <AuthHeader
          title={t("auth.signUp.title")}
          subtitle={t("auth.signUp.subtitle")}
        />

        <Card style={styles.card}>
          {formError && <FormError message={formError} />}

          <View style={styles.fields}>
            <TextInput
              label={t("auth.signUp.email")}
              value={email.value}
              onChangeText={email.onChange}
              error={email.error}
              keyboardType="email-address"
              autoComplete="email"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
            />
            <TextInput
              label={t("auth.signUp.password")}
              value={password.value}
              onChangeText={password.onChange}
              error={password.error}
              secureTextEntry
              autoComplete="password-new"
              returnKeyType="next"
              onSubmitEditing={() => confirmPasswordRef.current?.focus()}
              inputRef={passwordRef}
            />
            <TextInput
              label={t("auth.signUp.confirmPassword")}
              value={confirmPassword.value}
              onChangeText={confirmPassword.onChange}
              error={confirmPassword.error}
              secureTextEntry
              autoComplete="password-new"
              returnKeyType="go"
              onSubmitEditing={handleSubmit}
              inputRef={confirmPasswordRef}
            />
          </View>

          <AppText variant="caption" color={colors.textTertiary} align="center" style={styles.terms}>
            {t("auth.signUp.termsPrefix")}
            <AppText variant="caption" color={colors.accent}>
              {t("auth.signUp.termsLink")}
            </AppText>
            {t("auth.signUp.termsMiddle")}
            <AppText variant="caption" color={colors.accent}>
              {t("auth.signUp.privacyLink")}
            </AppText>
          </AppText>

          <Button
            title={t("auth.signUp.submit")}
            onPress={handleSubmit}
            loading={isLoading}
            disabled={isLoading}
          />
        </Card>

        <AuthFooterLink
          prompt={t("auth.signUp.hasAccount")}
          linkText={t("auth.signUp.signInLink")}
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
  card: {
    gap: spacing.lg,
  },
  fields: {
    gap: spacing.md,
  },
  terms: {
    lineHeight: 18,
  },
});
