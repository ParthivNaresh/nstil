import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";

import { useTheme } from "@/hooks/useTheme";
import { withAlpha } from "@/lib/colorUtils";
import { duration, radius, spacing } from "@/styles";

interface StepIndicatorProps {
  readonly totalSteps: number;
  readonly currentStep: number;
}

const DOT_SIZE = 8;
const ACTIVE_WIDTH = 24;
const INACTIVE_OPACITY = 0.2;

function Dot({
  isActive,
  activeColor,
  inactiveColor,
}: {
  readonly isActive: boolean;
  readonly activeColor: string;
  readonly inactiveColor: string;
}) {
  const animatedStyle = useAnimatedStyle(() => ({
    width: withTiming(isActive ? ACTIVE_WIDTH : DOT_SIZE, {
      duration: duration.normal,
      easing: Easing.out(Easing.cubic),
    }),
    backgroundColor: withTiming(isActive ? activeColor : inactiveColor, {
      duration: duration.normal,
    }),
  }));

  return <Animated.View style={[styles.dot, animatedStyle]} />;
}

export function StepIndicator({ totalSteps, currentStep }: StepIndicatorProps) {
  const { colors } = useTheme();
  const activeColor = colors.accent;
  const inactiveColor = withAlpha(colors.textTertiary, INACTIVE_OPACITY);

  return (
    <View style={styles.container}>
      {Array.from({ length: totalSteps }, (_, i) => (
        <Dot
          key={i}
          isActive={i === currentStep}
          activeColor={activeColor}
          inactiveColor={inactiveColor}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  dot: {
    height: DOT_SIZE,
    borderRadius: radius.full,
  },
});
