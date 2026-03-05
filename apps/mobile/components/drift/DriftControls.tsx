import * as Haptics from "expo-haptics";
import { useCallback } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { AppText } from "@/components/ui";
import { withAlpha } from "@/lib/colorUtils";
import { radius, spacing } from "@/styles";

interface DriftControlsProps {
  readonly onEnd: () => void;
}

const PILL_BG = "rgba(0, 0, 0, 0.35)";
const PILL_BORDER = "rgba(255, 255, 255, 0.15)";

export function DriftControls({ onEnd }: DriftControlsProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const handleEnd = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onEnd();
  }, [onEnd]);

  return (
    <View style={[styles.container, { bottom: insets.bottom + spacing.lg }]}>
      <Pressable
        onPress={handleEnd}
        style={styles.pill}
        accessibilityRole="button"
        accessibilityLabel={t("drift.endSessionA11y")}
      >
        <AppText variant="label" color={withAlpha("#FFFFFF", 0.85)}>
          {t("drift.endSession")}
        </AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10,
  },
  pill: {
    backgroundColor: PILL_BG,
    borderColor: PILL_BORDER,
    borderWidth: 1,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.full,
  },
});
