import * as Haptics from "expo-haptics";
import { useCallback } from "react";
import { Text } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

import { easing } from "@/styles";

import { ButtonSpinner } from "./ButtonSpinner";
import { buttonStyles, getVariantStyles } from "./styles";
import type { ButtonProps } from "./types";

const PRESS_SCALE = 0.97;

export function Button({
  title,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  icon,
  accessibilityLabel,
  testID,
}: ButtonProps) {
  const scale = useSharedValue(1);
  const isDisabled = disabled || loading;
  const variantStyle = getVariantStyles(variant);

  const handlePress = useCallback(() => {
    if (isDisabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }, [isDisabled, onPress]);

  const tapGesture = Gesture.Tap()
    .enabled(!isDisabled)
    .onBegin(() => {
      scale.value = withSpring(PRESS_SCALE, easing.spring);
    })
    .onFinalize(() => {
      scale.value = withSpring(1, easing.spring);
    })
    .onEnd(() => {
      handlePress();
    })
    .runOnJS(true);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <GestureDetector gesture={tapGesture}>
      <Animated.View
        style={[
          variantStyle.container,
          isDisabled && buttonStyles.disabled,
          animatedStyle,
        ]}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? title}
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        testID={testID}
      >
        {loading && <ButtonSpinner variant={variant} />}
        {!loading && icon}
        <Text style={variantStyle.text}>{title}</Text>
      </Animated.View>
    </GestureDetector>
  );
}
