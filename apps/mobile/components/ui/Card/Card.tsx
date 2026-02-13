import * as Haptics from "expo-haptics";
import { ChevronRight } from "lucide-react-native";
import { useCallback } from "react";
import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

import { Icon } from "@/components/ui/Icon";
import { colors, easing } from "@/styles";

import { cardStyles, getCardVariantStyle } from "./styles";
import type { CardProps } from "./types";

const PRESS_SCALE = 0.98;

export function Card({
  children,
  onPress,
  variant = "glass",
  showChevron = false,
  style,
  accessibilityLabel,
  testID,
}: CardProps) {
  const scale = useSharedValue(1);
  const variantStyle = getCardVariantStyle(variant);

  const handlePress = useCallback(() => {
    if (!onPress) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }, [onPress]);

  const tapGesture = Gesture.Tap()
    .enabled(Boolean(onPress))
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

  const content = onPress ? (
    <View style={cardStyles.pressable}>
      <View style={cardStyles.content}>{children}</View>
      {showChevron ? (
        <View style={cardStyles.chevron}>
          <Icon icon={ChevronRight} size="sm" color={colors.textTertiary} />
        </View>
      ) : null}
    </View>
  ) : (
    children
  );

  if (!onPress) {
    return (
      <View
        style={[variantStyle, style]}
        accessibilityLabel={accessibilityLabel}
        testID={testID}
      >
        {content}
      </View>
    );
  }

  return (
    <GestureDetector gesture={tapGesture}>
      <Animated.View
        style={[variantStyle, animatedStyle, style]}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        testID={testID}
      >
        {content}
      </Animated.View>
    </GestureDetector>
  );
}
