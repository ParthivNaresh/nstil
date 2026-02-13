import { Link } from "expo-router";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, TextInput as RNTextInput, View } from "react-native";

import { AuthFooterLink, AuthHeader, FormError } from "@/components/auth";
import { AppText, Button, Card, ScreenContainer, TextInput } from "@/components/ui";
import { useSignInForm } from "@/hooks";
import { colors, spacing } from "@/styles";

export default function SignInScreen() {
  const { t } = useTranslation();
  const { email, password, isLoading, formError, handleSubmit } = useSignInForm();
  const passwordRef = useRef<RNTextInput>(null);

  return (
    <ScreenContainer>
      <View style={styles.content}>
        <AuthHeader
          title={t("auth.signIn.title")}
          subtitle={t("auth.signIn.subtitle")}
        />

        <Card style={styles.card}>
          {formError && <FormError message={formError} />}

          <View style={styles.fields}>
            <TextInput
              label={t("auth.signIn.email")}
              value={email.value}
              onChangeText={email.onChange}
              error={email.error}
              keyboardType="email-address"
              autoComplete="email"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
            />
            <TextInput
              label={t("auth.signIn.password")}
              value={password.value}
              onChangeText={password.onChange}
              error={password.error}
              secureTextEntry
              autoComplete="password"
              returnKeyType="go"
              onSubmitEditing={handleSubmit}
              inputRef={passwordRef}
            />
          </View>

          <Link href="/(auth)/forgot-password" asChild>
            <AppText variant="bodySmall" color={colors.accent} align="right">
              {t("auth.signIn.forgotPassword")}
            </AppText>
          </Link>

          <Button
            title={t("auth.signIn.submit")}
            onPress={handleSubmit}
            loading={isLoading}
            disabled={isLoading}
          />
        </Card>

        <AuthFooterLink
          prompt={t("auth.signIn.noAccount")}
          linkText={t("auth.signIn.signUpLink")}
          href="/(auth)/sign-up"
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
});
