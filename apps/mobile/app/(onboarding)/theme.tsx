import { useRouter } from "expo-router";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { OnboardingStep } from "@/components/onboarding";
import { ThemePicker } from "@/components/settings";
import { Button } from "@/components/ui";
import { useTheme } from "@/hooks/useTheme";

const TOTAL_STEPS = 4;

export default function ThemeStep() {
  const { t } = useTranslation();
  const { mode, setMode } = useTheme();
  const router = useRouter();

  const handleContinue = useCallback(() => {
    router.push("/(onboarding)/notifications");
  }, [router]);

  return (
    <OnboardingStep
      step={2}
      totalSteps={TOTAL_STEPS}
      title={t("onboarding.theme.title")}
      subtitle={t("onboarding.theme.subtitle")}
      footer={
        <Button
          title={t("onboarding.theme.continue")}
          onPress={handleContinue}
        />
      }
    >
      <ThemePicker currentMode={mode} onSelect={setMode} showLabel={false} />
    </OnboardingStep>
  );
}
