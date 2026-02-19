import {
  Canvas,
  LinearGradient,
  RoundedRect,
  vec,
} from "@shopify/react-native-skia";
import { Flame } from "lucide-react-native";
import { useCallback, useState } from "react";
import { type LayoutChangeEvent, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppText, Icon } from "@/components/ui";
import { useTheme } from "@/hooks/useTheme";
import { withAlpha } from "@/lib/colorUtils";
import type { StreakData } from "@/lib/insightUtils";
import { radius, spacing } from "@/styles";

interface StreakBannerProps {
  readonly data: StreakData;
}

const GRADIENT_OPACITY = 0.15;
const BANNER_RADIUS = 16;

export function StreakBanner({ data }: StreakBannerProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [size, setSize] = useState({ width: 0, height: 0 });

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize({ width, height });
  }, []);

  const isMilestone = data.milestone > 0;

  return (
    <View
      style={[styles.container, { borderColor: colors.glassBorder }]}
      onLayout={handleLayout}
    >
      {size.width > 0 ? (
        <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
          <RoundedRect
            x={0}
            y={0}
            width={size.width}
            height={size.height}
            r={BANNER_RADIUS}
          >
            <LinearGradient
              start={vec(0, 0)}
              end={vec(size.width, 0)}
              colors={[
                withAlpha("#F6B93B", GRADIENT_OPACITY),
                withAlpha("#E55039", GRADIENT_OPACITY),
              ]}
            />
          </RoundedRect>
        </Canvas>
      ) : null}

      <View style={styles.content}>
        <Icon icon={Flame} size="lg" color="#F6B93B" />
        <View style={styles.textSection}>
          <AppText variant="h3" color={colors.textPrimary}>
            {t("insights.streakCount", { count: data.streakLength })}
          </AppText>
          {isMilestone ? (
            <AppText variant="bodySmall" color={colors.textSecondary}>
              {t("insights.streakMilestone", { milestone: data.milestone })}
            </AppText>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.md,
    overflow: "hidden",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  textSection: {
    flex: 1,
    gap: spacing.xs,
  },
});
