import Animated, {
  useAnimatedStyle,
  type SharedValue,
  interpolate,
  interpolateColor,
} from "react-native-reanimated";

import { colors, typography } from "@/styles";

interface FloatingLabelProps {
  label: string;
  progress: SharedValue<number>;
  hasError: boolean;
}

const LABEL_INACTIVE_TOP = 18;
const LABEL_ACTIVE_TOP = 6;
const LABEL_INACTIVE_SIZE = typography.body.fontSize ?? 16;
const LABEL_ACTIVE_SIZE = typography.caption.fontSize ?? 12;

export function FloatingLabel({ label, progress, hasError }: FloatingLabelProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const top = interpolate(progress.value, [0, 1], [LABEL_INACTIVE_TOP, LABEL_ACTIVE_TOP]);
    const fontSize = interpolate(
      progress.value,
      [0, 1],
      [LABEL_INACTIVE_SIZE, LABEL_ACTIVE_SIZE],
    );

    const color = hasError
      ? colors.error
      : interpolateColor(
          progress.value,
          [0, 1],
          [colors.textTertiary, colors.textSecondary],
        );

    return {
      position: "absolute" as const,
      left: 16,
      top,
      fontSize,
      color,
    };
  });

  return <Animated.Text style={animatedStyle}>{label}</Animated.Text>;
}
