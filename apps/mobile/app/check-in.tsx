import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useMemo } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import {
  CheckInLoading,
  CheckInMood,
  CheckInOutcome,
  CheckInPrompt,
} from "@/components/checkIn";
import { Header } from "@/components/ui";
import { useCheckIn } from "@/hooks/useCheckIn";
import { useHeaderHeight, useTheme } from "@/hooks";
import { queryClient } from "@/lib/queryClient";
import { queryKeys } from "@/lib/queryKeys";
import type { TriggerSource } from "@/types";

function parseTriggerSource(source: string | undefined): TriggerSource {
  if (source === "notification") return "notification";
  if (source === "app_open") return "app_open";
  return "manual";
}

export default function CheckInScreen() {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const router = useRouter();
  const headerHeight = useHeaderHeight();
  const params = useLocalSearchParams<{ source?: string }>();

  const triggerSource = useMemo(
    () => parseTriggerSource(params.source),
    [params.source],
  );

  const {
    step,
    session,
    promptContent,
    moodCategory,
    moodSpecific,
    responseText,
    error,
    isSubmitting,
    setMoodCategory,
    setMoodSpecific,
    setResponseText,
    submitMood,
    submitResponse,
    complete,
    convert,
    abandon,
    retry,
  } = useCheckIn(triggerSource);

  const handleBack = useCallback(() => {
    const hasProgress = step === "prompt" || step === "outcome";

    if (!hasProgress) {
      if (session) {
        void abandon();
      }
      router.back();
      return;
    }

    Alert.alert(
      t("checkIn.abandonTitle"),
      t("checkIn.abandonMessage"),
      [
        { text: t("checkIn.abandonCancel"), style: "cancel" },
        {
          text: t("checkIn.abandonConfirm"),
          style: "destructive",
          onPress: async () => {
            await abandon();
            router.back();
          },
        },
      ],
    );
  }, [step, session, abandon, router, t]);

  const handleComplete = useCallback(async () => {
    await complete();
    void queryClient.invalidateQueries({ queryKey: queryKeys.entries.all });
    router.replace("/(tabs)");
  }, [complete, router]);

  const handleConvert = useCallback(async () => {
    const entry = await convert();
    void queryClient.invalidateQueries({ queryKey: queryKeys.entries.all });
    if (entry) {
      router.replace({
        pathname: `/entry/${entry.id}`,
        params: promptContent ? { prompt: promptContent } : undefined,
      });
    } else {
      router.replace("/(tabs)");
    }
  }, [convert, router, promptContent]);

  return (
    <View style={styles.root}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Header
        title={t("checkIn.moodTitle")}
        onBack={handleBack}
      />
      <View style={[styles.content, { paddingTop: headerHeight }]}>
        {step === "loading" ? (
          <CheckInLoading
            error={error}
            onRetry={retry}
          />
        ) : null}

        {step === "mood" ? (
          <CheckInMood
            category={moodCategory}
            specific={moodSpecific}
            onCategoryChange={setMoodCategory}
            onSpecificChange={setMoodSpecific}
            onContinue={submitMood}
          />
        ) : null}

        {step === "prompt" ? (
          <CheckInPrompt
            promptContent={promptContent}
            moodCategory={moodCategory}
            responseText={responseText}
            isSubmitting={isSubmitting}
            onResponseChange={setResponseText}
            onSubmit={submitResponse}
            onSkip={submitResponse}
          />
        ) : null}

        {step === "outcome" ? (
          <CheckInOutcome
            moodCategory={moodCategory}
            sessionStatus={session?.status ?? null}
            isSubmitting={isSubmitting}
            onComplete={handleComplete}
            onConvert={handleConvert}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
