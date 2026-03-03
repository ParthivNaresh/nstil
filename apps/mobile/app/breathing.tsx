import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useRef, useState } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import {
  BreathingCircle,
  BreathingComplete,
  BreathingDurationPicker,
  BreathingPatternPicker,
  BreathingPhaseLabel,
  BreathingProgress,
} from "@/components/breathing";
import { AmbientBackground, Button, Header, ScrollContainer } from "@/components/ui";
import { useBreathing, useCreateBreathingSession, useHeaderHeight, useTheme, useUpdateBreathingSession } from "@/hooks";
import { computeCycleCount, computeSessionDuration } from "@/lib/breathingPatterns";
import { spacing } from "@/styles";
import type { MoodCategory } from "@/types";
import type { BreathingPatternId } from "@/types/breathing";

type ScreenStep = "setup" | "exercise" | "complete";

const DURATION_OPTIONS = [1, 3, 5] as const;
const DEFAULT_DURATION_MINUTES = 3;
const DEFAULT_PATTERN: BreathingPatternId = "box";
const SECONDS_PER_MINUTE = 60;

const CIRCLE_SIZE = Math.min(Dimensions.get("window").width - spacing.xl * 2, 280);

export default function BreathingScreen() {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const router = useRouter();
  const headerHeight = useHeaderHeight();

  const [step, setStep] = useState<ScreenStep>("setup");
  const [patternId, setPatternId] = useState<BreathingPatternId>(DEFAULT_PATTERN);
  const [durationMinutes, setDurationMinutes] = useState(DEFAULT_DURATION_MINUTES);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const durationSeconds = durationMinutes * SECONDS_PER_MINUTE;
  const totalCycles = computeCycleCount(patternId, durationSeconds);

  const breathing = useBreathing(patternId, totalCycles);
  const prevPhaseRef = useRef(breathing.phase);

  const createSession = useCreateBreathingSession();
  const updateSession = useUpdateBreathingSession();

  useEffect(() => {
    if (prevPhaseRef.current !== breathing.phase && breathing.isActive) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    prevPhaseRef.current = breathing.phase;
  }, [breathing.phase, breathing.isActive]);

  useEffect(() => {
    if (breathing.isComplete && step === "exercise") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStep("complete");
    }
  }, [breathing.isComplete, step]);

  const handleStart = useCallback(() => {
    const sessionDuration = computeSessionDuration(patternId, totalCycles);

    createSession.mutate(
      {
        pattern: patternId,
        duration_seconds: sessionDuration,
        cycles_target: totalCycles,
      },
      {
        onSuccess: (session) => {
          setSessionId(session.id);
        },
      },
    );

    setStep("exercise");
    breathing.start();
  }, [patternId, totalCycles, createSession, breathing]);

  const handlePauseResume = useCallback(() => {
    if (breathing.isPaused) {
      breathing.resume();
    } else {
      breathing.pause();
    }
  }, [breathing]);

  const handleStop = useCallback(() => {
    breathing.stop();

    if (sessionId) {
      updateSession.mutate({
        id: sessionId,
        data: {
          cycles_completed: breathing.currentCycle,
          completed: false,
        },
      });
    }

    setStep("setup");
    setSessionId(null);
  }, [breathing, sessionId, updateSession]);

  const handleComplete = useCallback(
    (moodAfter: MoodCategory | null) => {
      if (sessionId) {
        updateSession.mutate({
          id: sessionId,
          data: {
            cycles_completed: totalCycles,
            mood_after: moodAfter ?? undefined,
            completed: true,
          },
        });
      }

      router.back();
    },
    [sessionId, totalCycles, updateSession, router],
  );

  const handleBack = useCallback(() => {
    if (step === "exercise") {
      handleStop();
      return;
    }
    if (step === "complete") {
      handleComplete(null);
      return;
    }
    router.back();
  }, [step, handleStop, handleComplete, router]);

  return (
    <View style={styles.root}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <AmbientBackground />
      <Header title="" onBack={handleBack} />

      {step === "setup" ? (
        <ScrollContainer
          contentContainerStyle={[
            styles.setupContent,
            { paddingTop: headerHeight + spacing.lg },
          ]}
          keyboardAware={false}
        >
          <BreathingPatternPicker
            selected={patternId}
            onSelect={setPatternId}
          />
          <BreathingDurationPicker
            selected={durationMinutes}
            options={DURATION_OPTIONS}
            onSelect={setDurationMinutes}
          />
          <Button
            title={t("breathing.start")}
            onPress={handleStart}
          />
        </ScrollContainer>
      ) : null}

      {step === "exercise" ? (
        <View style={[styles.content, styles.exerciseContent, { paddingTop: headerHeight }]}>
          <BreathingProgress
            currentCycle={breathing.currentCycle}
            totalCycles={totalCycles}
          />
          <View style={styles.circleContainer}>
            <BreathingCircle
              phase={breathing.phase}
              progress={breathing.progress}
              size={CIRCLE_SIZE}
            />
          </View>
          <BreathingPhaseLabel
            phase={breathing.phase}
            phaseDuration={breathing.phaseDuration}
          />
          <View style={styles.exerciseActions}>
            <Button
              title={breathing.isPaused ? t("breathing.resume") : t("breathing.pause")}
              onPress={handlePauseResume}
              variant="secondary"
            />
          </View>
        </View>
      ) : null}

      {step === "complete" ? (
        <View style={[styles.content, { paddingTop: headerHeight }]}>
          <BreathingComplete
            cyclesCompleted={totalCycles}
            onDone={handleComplete}
          />
        </View>
      ) : null}
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
  setupContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  exerciseContent: {
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  circleContainer: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  exerciseActions: {
    gap: spacing.md,
  },
});
