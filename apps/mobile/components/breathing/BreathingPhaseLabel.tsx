import { StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useTranslation } from "react-i18next";

import { AppText } from "@/components/ui";
import { useTheme } from "@/hooks/useTheme";
import type { BreathingPhase } from "@/types/breathing";

interface BreathingPhaseLabelProps {
  readonly phase: BreathingPhase;
  readonly phaseDuration: number;
}

const FADE_DURATION = 200;

const PHASE_TRANSLATION_KEYS: Record<BreathingPhase, string> = {
  inhale: "breathing.phases.inhale",
  hold: "breathing.phases.hold",
  exhale: "breathing.phases.exhale",
  rest: "breathing.phases.rest",
};

export function BreathingPhaseLabel({ phase, phaseDuration }: BreathingPhaseLabelProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Animated.View
        key={phase}
        entering={FadeIn.duration(FADE_DURATION)}
        exiting={FadeOut.duration(FADE_DURATION)}
        style={styles.labelWrapper}
      >
        <AppText variant="h2" color={colors.textPrimary}>
          {t(PHASE_TRANSLATION_KEYS[phase])}
        </AppText>
        <AppText variant="body" color={colors.textSecondary}>
          {phaseDuration}s
        </AppText>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    minHeight: 64,
    justifyContent: "center",
  },
  labelWrapper: {
    alignItems: "center",
    gap: 4,
  },
});
