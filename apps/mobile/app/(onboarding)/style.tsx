import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import { OnboardingStep } from "@/components/onboarding";
import { PromptStylePicker } from "@/components/settings/AIProfileSettings/PromptStylePicker";
import { Button } from "@/components/ui";
import { useUpdateAIProfile } from "@/hooks/useAIProfile";
import type { PromptStyle } from "@/types";

const TOTAL_STEPS = 4;

export default function StyleStep() {
  const { t } = useTranslation();
  const router = useRouter();
  const { mutateAsync: updateAIProfile, isPending } = useUpdateAIProfile();
  const [style, setStyle] = useState<PromptStyle>("gentle");

  const handleContinue = useCallback(async () => {
    await updateAIProfile({ prompt_style: style });
    router.push("/(onboarding)/theme");
  }, [style, updateAIProfile, router]);

  return (
    <OnboardingStep
      step={1}
      totalSteps={TOTAL_STEPS}
      title={t("onboarding.style.title")}
      subtitle={t("onboarding.style.subtitle")}
      footer={
        <Button
          title={t("onboarding.style.continue")}
          onPress={handleContinue}
          loading={isPending}
          disabled={isPending}
        />
      }
    >
      <PromptStylePicker value={style} onChange={setStyle} showLabel={false} />
    </OnboardingStep>
  );
}
