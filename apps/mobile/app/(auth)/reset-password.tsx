import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, TextInput as RNTextInput, View } from "react-native";

import { AuthHeader, FormError } from "@/components/auth";
import { Button, Card, ScreenContainer, TextInput } from "@/components/ui";
import { useResetPassword } from "@/hooks";
import { spacing } from "@/styles";

export default function ResetPasswordScreen() {
  const { t } = useTranslation();
  const { newPassword, confirmPassword, isLoading, formError, handleSubmit } =
    useResetPassword();
  const confirmPasswordRef = useRef<RNTextInput>(null);

  return (
    <ScreenContainer>
      <View style={styles.content}>
        <AuthHeader
          title={t("auth.resetPassword.title")}
          subtitle={t("auth.resetPassword.subtitle")}
        />

        <Card style={styles.card}>
          {formError && <FormError message={formError} />}

          <View style={styles.fields}>
            <TextInput
              label={t("auth.resetPassword.newPassword")}
              value={newPassword.value}
              onChangeText={newPassword.onChange}
              error={newPassword.error}
              secureTextEntry
              autoComplete="password-new"
              returnKeyType="next"
              onSubmitEditing={() => confirmPasswordRef.current?.focus()}
            />
            <TextInput
              label={t("auth.resetPassword.confirmPassword")}
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

          <Button
            title={t("auth.resetPassword.submit")}
            onPress={handleSubmit}
            loading={isLoading}
            disabled={isLoading}
          />
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
    gap: spacing.xl,
  },
  card: {
    gap: spacing.lg,
  },
  fields: {
    gap: spacing.md,
  },
});
