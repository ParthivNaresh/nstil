import { StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";

import { AppText } from "@/components/ui";
import { useTheme } from "@/hooks/useTheme";

interface BreathingProgressProps {
  readonly currentCycle: number;
  readonly totalCycles: number;
}

export function BreathingProgress({ currentCycle, totalCycles }: BreathingProgressProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const displayCycle = Math.min(currentCycle + 1, totalCycles);

  return (
    <AppText variant="caption" color={colors.textSecondary} style={styles.text}>
      {t("breathing.progress", { current: displayCycle, total: totalCycles })}
    </AppText>
  );
}

const styles = StyleSheet.create({
  text: {
    textAlign: "center",
  },
});
