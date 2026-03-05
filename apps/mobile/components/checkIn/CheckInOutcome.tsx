import { Check } from "lucide-react-native";
import { useCallback, useEffect, useRef } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  cancelAnimation,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import { AppText, Button, Icon } from "@/components/ui";
import { useTheme } from "@/hooks/useTheme";
import { withAlpha } from "@/lib/colorUtils";
import { getMoodGradient } from "@/lib/moodColors";
import { radius, spacing } from "@/styles";
import type { MoodCategory, SessionStatus } from "@/types";

interface CheckInOutcomeProps {
  readonly moodCategory: MoodCategory | null;
  readonly sessionStatus: SessionStatus | null;
  readonly isSubmitting: boolean;
  readonly onComplete: () => void;
  readonly onConvert: () => void;
}

const FADE_DURATION = 400;
const PULSE_DURATION = 1500;
const AUTO_COMPLETE_MS = 8000;

export function CheckInOutcome({
  moodCategory,
  sessionStatus,
  isSubmitting,
  onComplete,
  onConvert,
}: CheckInOutcomeProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const gradient = getMoodGradient(moodCategory);
  const pulseScale = useSharedValue(1);
  const autoCompleteRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isFinished = sessionStatus === "completed" || sessionStatus === "converted";

  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: PULSE_DURATION }),
        withTiming(1, { duration: PULSE_DURATION }),
      ),
      -1,
      true,
    );
    return () => cancelAnimation(pulseScale);
  }, [pulseScale]);

  useEffect(() => {
    if (isFinished) return;

    autoCompleteRef.current = setTimeout(() => {
      onComplete();
    }, AUTO_COMPLETE_MS);

    return () => {
      if (autoCompleteRef.current) {
        clearTimeout(autoCompleteRef.current);
      }
    };
  }, [isFinished, onComplete]);

  const handleConvert = useCallback(() => {
    if (autoCompleteRef.current) {
      clearTimeout(autoCompleteRef.current);
    }
    onConvert();
  }, [onConvert]);

  const handleComplete = useCallback(() => {
    if (autoCompleteRef.current) {
      clearTimeout(autoCompleteRef.current);
    }
    onComplete();
  }, [onComplete]);

  const handleBreathing = useCallback(() => {
    if (autoCompleteRef.current) {
      clearTimeout(autoCompleteRef.current);
    }
    onComplete();
    router.push("/breathing");
  }, [onComplete, router]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  return (
    <Animated.View
      entering={FadeIn.duration(FADE_DURATION)}
      style={styles.container}
    >
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.checkCircle,
            { backgroundColor: withAlpha(gradient.from, 0.15) },
            pulseStyle,
          ]}
        >
          <View
            style={[
              styles.checkInner,
              { backgroundColor: withAlpha(gradient.from, 0.3) },
            ]}
          >
            <Icon icon={Check} size="lg" color={gradient.from} />
          </View>
        </Animated.View>

        <AppText variant="h2" color={colors.textPrimary}>
          {t("checkIn.outcomeTitle")}
        </AppText>
        <AppText variant="body" color={colors.textSecondary}>
          {t("checkIn.outcomeSubtitle")}
        </AppText>
      </View>

      {!isFinished ? (
        <View style={styles.footer}>
          <Button
            title={t("checkIn.saveCheckIn")}
            onPress={handleComplete}
            loading={isSubmitting}
          />
          <Button
            title={t("checkIn.expandToEntry")}
            onPress={handleConvert}
            variant="secondary"
            disabled={isSubmitting}
          />
          <Pressable
            onPress={handleBreathing}
            style={styles.breathingLink}
            hitSlop={8}
          >
            <AppText variant="caption" color={colors.accent}>
              {t("checkIn.needAMoment")}
            </AppText>
          </Pressable>
        </View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.md,
  },
  checkCircle: {
    width: 96,
    height: 96,
    borderRadius: radius.full,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  checkInner: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  footer: {
    gap: spacing.md,
  },
  breathingLink: {
    alignItems: "center",
    paddingVertical: spacing.xs,
  },
});
