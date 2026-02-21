import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { OnboardingStep } from "@/components/onboarding";
import { Button, TextInput } from "@/components/ui";
import { useUpdateProfile } from "@/hooks/useProfile";
import { spacing } from "@/styles";

const TOTAL_STEPS = 4;

export default function WelcomeStep() {
  const { t } = useTranslation();
  const router = useRouter();
  const { mutateAsync: updateProfile, isPending } = useUpdateProfile();
  const [name, setName] = useState("");

  const handleContinue = useCallback(async () => {
    const trimmed = name.trim();
    if (trimmed) {
      await updateProfile({ display_name: trimmed });
    }
    router.push("/(onboarding)/style");
  }, [name, updateProfile, router]);

  const handleSkip = useCallback(() => {
    router.push("/(onboarding)/style");
  }, [router]);

  return (
    <OnboardingStep
      step={0}
      totalSteps={TOTAL_STEPS}
      title={t("onboarding.welcome.title")}
      subtitle={t("onboarding.welcome.subtitle")}
      footer={
        <View style={styles.footer}>
          <Button
            title={t("onboarding.welcome.continue")}
            onPress={handleContinue}
            loading={isPending}
            disabled={isPending}
          />
          <Button
            title={t("onboarding.welcome.skip")}
            onPress={handleSkip}
            variant="ghost"
            disabled={isPending}
          />
        </View>
      }
    >
      <View style={styles.inputContainer}>
        <TextInput
          label={t("onboarding.welcome.nameLabel")}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          autoComplete="off"
          returnKeyType="done"
          onSubmitEditing={handleContinue}
          variant="flat"
        />
      </View>
    </OnboardingStep>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    paddingHorizontal: spacing.md,
  },
  footer: {
    gap: spacing.sm,
  },
});
