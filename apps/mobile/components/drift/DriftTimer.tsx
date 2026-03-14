import { memo } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@/components/ui";
import { withAlpha } from "@/lib/colorUtils";
import { radius, spacing } from "@/styles";

interface DriftTimerProps {
  readonly elapsed: number;
}

function formatElapsed(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function DriftTimerInner({ elapsed }: DriftTimerProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[styles.container, { top: insets.top + spacing.sm }]}
      pointerEvents="none"
    >
      <View style={styles.pill}>
        <AppText variant="label" color={withAlpha("#FFFFFF", 0.8)}>
          {formatElapsed(elapsed)}
        </AppText>
      </View>
    </View>
  );
}

export const DriftTimer = memo(DriftTimerInner);

const PILL_BG = "rgba(0, 0, 0, 0.35)";

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    right: spacing.md,
    zIndex: 10,
  },
  pill: {
    backgroundColor: PILL_BG,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
  },
});
