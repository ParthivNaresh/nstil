import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn } from "react-native-reanimated";

import { AppText } from "@/components/ui";
import { useTheme } from "@/hooks/useTheme";
import { spacing } from "@/styles";

import { StepIndicator } from "./StepIndicator";

interface OnboardingStepProps {
  readonly step: number;
  readonly totalSteps: number;
  readonly title: string;
  readonly subtitle: string;
  readonly children: ReactNode;
  readonly footer: ReactNode;
}

const FADE_DURATION = 400;

export function OnboardingStep({
  step,
  totalSteps,
  title,
  subtitle,
  children,
  footer,
}: OnboardingStepProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Animated.View
      entering={FadeIn.duration(FADE_DURATION)}
      style={[
        styles.container,
        {
          paddingTop: insets.top + spacing.xl,
          paddingBottom: insets.bottom + spacing.lg,
        },
      ]}
    >
      <StepIndicator totalSteps={totalSteps} currentStep={step} />

      <View style={styles.header}>
        <AppText variant="h1" align="center">
          {title}
        </AppText>
        <AppText variant="body" color={colors.textSecondary} align="center">
          {subtitle}
        </AppText>
      </View>

      <View style={styles.content}>{children}</View>

      <View style={styles.footer}>{footer}</View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  header: {
    gap: spacing.sm,
    marginTop: spacing["2xl"],
  },
  content: {
    flex: 1,
    justifyContent: "center",
  },
  footer: {
    gap: spacing.sm,
  },
});
