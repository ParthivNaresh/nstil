import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { AppText } from "@/components/ui";
import { MoodItem } from "@/components/ui/MoodSelector/MoodItem";
import { withAlpha } from "@/lib/colorUtils";
import { MOOD_CATEGORIES } from "@/lib/moodUtils";
import { radius, spacing } from "@/styles";
import type { MoodCategory } from "@/types";

import type { DriftSessionResult } from "@/lib/drift";

type PickerStep = "before" | "after" | "done";

interface DriftMoodPickerProps {
  readonly durationSec: number;
  readonly onComplete: (result: DriftSessionResult) => void;
}

const FADE_DURATION = 250;
const OVERLAY_BG = "rgba(0, 0, 0, 0.6)";
const CARD_BG = "rgba(20, 20, 30, 0.85)";
const CARD_BORDER = "rgba(255, 255, 255, 0.1)";
const PILL_BG = "rgba(255, 255, 255, 0.1)";
const PILL_BORDER = "rgba(255, 255, 255, 0.15)";

function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds}s`;
  if (seconds === 0) return `${minutes}m`;
  return `${minutes}m ${seconds}s`;
}

export function DriftMoodPicker({ durationSec, onComplete }: DriftMoodPickerProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<PickerStep>("before");
  const [moodBefore, setMoodBefore] = useState<MoodCategory | null>(null);
  const [moodAfter, setMoodAfter] = useState<MoodCategory | null>(null);

  const handleBeforeSelect = useCallback((category: MoodCategory) => {
    setMoodBefore(category);
    setStep("after");
  }, []);

  const handleAfterSelect = useCallback((category: MoodCategory) => {
    setMoodAfter(category);
    setStep("done");
  }, []);

  const handleDone = useCallback(() => {
    onComplete({
      durationSec,
      moodBefore,
      moodAfter,
    });
  }, [durationSec, moodBefore, moodAfter, onComplete]);

  const handleSkip = useCallback(() => {
    if (step === "before") {
      setStep("after");
      return;
    }
    if (step === "after") {
      setStep("done");
      return;
    }
    onComplete({
      durationSec,
      moodBefore,
      moodAfter,
    });
  }, [step, durationSec, moodBefore, moodAfter, onComplete]);

  return (
    <View style={[styles.overlay, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.centered}>
        <Animated.View
          key={step}
          entering={FadeIn.duration(FADE_DURATION)}
          exiting={FadeOut.duration(FADE_DURATION)}
          style={styles.card}
        >
          {step === "before" ? (
            <MoodStepContent
              title={t("drift.mood.beforeTitle")}
              subtitle={t("drift.mood.beforeSubtitle")}
              skipLabel={t("drift.mood.skip")}
              selected={moodBefore}
              onSelect={handleBeforeSelect}
              onSkip={handleSkip}
            />
          ) : null}

          {step === "after" ? (
            <MoodStepContent
              title={t("drift.mood.afterTitle")}
              subtitle={t("drift.mood.afterSubtitle")}
              skipLabel={t("drift.mood.skip")}
              selected={moodAfter}
              onSelect={handleAfterSelect}
              onSkip={handleSkip}
            />
          ) : null}

          {step === "done" ? (
            <DoneContent
              title={t("drift.complete.title")}
              subtitle={t("drift.complete.duration", {
                duration: formatDuration(durationSec),
              })}
              doneLabel={t("drift.complete.done")}
              onDone={handleDone}
            />
          ) : null}
        </Animated.View>
      </View>
    </View>
  );
}

interface MoodStepContentProps {
  readonly title: string;
  readonly subtitle: string;
  readonly skipLabel: string;
  readonly selected: MoodCategory | null;
  readonly onSelect: (category: MoodCategory) => void;
  readonly onSkip: () => void;
}

function MoodStepContent({
  title,
  subtitle,
  skipLabel,
  selected,
  onSelect,
  onSkip,
}: MoodStepContentProps) {
  return (
    <View style={styles.stepContainer}>
      <View style={styles.header}>
        <AppText variant="h3" color={withAlpha("#FFFFFF", 0.9)}>
          {title}
        </AppText>
        <AppText variant="bodySmall" color={withAlpha("#FFFFFF", 0.5)}>
          {subtitle}
        </AppText>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.moodRow}
      >
        {MOOD_CATEGORIES.map((cat) => (
          <MoodItem
            key={cat}
            category={cat}
            isSelected={selected === cat}
            onSelect={onSelect}
          />
        ))}
      </ScrollView>

      <Pressable onPress={onSkip} style={styles.skipButton}>
        <AppText variant="caption" color={withAlpha("#FFFFFF", 0.4)}>
          {skipLabel}
        </AppText>
      </Pressable>
    </View>
  );
}

interface DoneContentProps {
  readonly title: string;
  readonly subtitle: string;
  readonly doneLabel: string;
  readonly onDone: () => void;
}

function DoneContent({ title, subtitle, doneLabel, onDone }: DoneContentProps) {
  return (
    <View style={styles.stepContainer}>
      <View style={styles.header}>
        <AppText variant="h3" color={withAlpha("#FFFFFF", 0.9)}>
          {title}
        </AppText>
        <AppText variant="bodySmall" color={withAlpha("#FFFFFF", 0.5)}>
          {subtitle}
        </AppText>
      </View>

      <Pressable onPress={onDone} style={styles.donePill}>
        <AppText variant="label" color={withAlpha("#FFFFFF", 0.85)}>
          {doneLabel}
        </AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: OVERLAY_BG,
    justifyContent: "center",
    zIndex: 20,
  },
  centered: {
    alignItems: "center",
    paddingHorizontal: spacing.lg,
  },
  card: {
    backgroundColor: CARD_BG,
    borderColor: CARD_BORDER,
    borderWidth: 1,
    borderRadius: radius["2xl"],
    width: "100%",
    maxWidth: 360,
    overflow: "hidden",
  },
  stepContainer: {
    padding: spacing.lg,
    gap: spacing.lg,
    alignItems: "center",
  },
  header: {
    alignItems: "center",
    gap: spacing.xs,
  },
  moodRow: {
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  skipButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  donePill: {
    backgroundColor: PILL_BG,
    borderColor: PILL_BORDER,
    borderWidth: 1,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.full,
  },
});
