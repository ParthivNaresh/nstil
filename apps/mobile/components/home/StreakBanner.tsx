import {
  Canvas,
  LinearGradient,
  RoundedRect,
  vec,
} from "@shopify/react-native-skia";
import { Flame } from "lucide-react-native";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppText, Icon } from "@/components/ui";
import { useTheme } from "@/hooks/useTheme";
import { useCanvasSize } from "@/lib/animation";
import { withAlpha } from "@/lib/colorUtils";
import { radius, spacing } from "@/styles";

interface StreakBannerProps {
  readonly streak: number;
}

const GRADIENT_OPACITY = 0.15;
const BANNER_RADIUS = 16;

export function StreakBanner({ streak }: StreakBannerProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { size, onLayout, hasSize } = useCanvasSize();

  return (
    <View
      style={[styles.container, { borderColor: colors.glassBorder }]}
      onLayout={onLayout}
    >
      {hasSize ? (
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
        <AppText variant="h3" color={colors.textPrimary}>
          {t("home.streakCount", { count: streak })}
        </AppText>
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
});
