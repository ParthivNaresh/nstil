import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { AppText } from "@/components/ui";
import { withAlpha } from "@/lib/colorUtils";
import { spacing } from "@/styles";

interface DriftReadyOverlayProps {
  readonly onStart: () => void;
}

const OVERLAY_BG = "rgba(0, 0, 0, 0.5)";

export function DriftReadyOverlay({ onStart }: DriftReadyOverlayProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <Pressable
      style={[styles.overlay, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
      onPress={onStart}
      accessibilityRole="button"
      accessibilityLabel={t("drift.ready.subtitle")}
    >
      <View style={styles.content}>
        <AppText variant="h2" color={withAlpha("#FFFFFF", 0.9)}>
          {t("drift.ready.title")}
        </AppText>
        <AppText variant="body" color={withAlpha("#FFFFFF", 0.5)}>
          {t("drift.ready.subtitle")}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: OVERLAY_BG,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 20,
  },
  content: {
    alignItems: "center",
    gap: spacing.sm,
  },
});
