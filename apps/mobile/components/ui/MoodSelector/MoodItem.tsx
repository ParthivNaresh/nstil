import * as Haptics from "expo-haptics";
import { Canvas, LinearGradient, Rect, vec } from "@shopify/react-native-skia";
import { useCallback } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

import { AppText } from "@/components/ui/AppText";
import { useTheme } from "@/hooks/useTheme";
import { withAlpha } from "@/lib/colorUtils";
import { getMoodGradient } from "@/lib/moodColors";
import { easing, radius } from "@/styles";

import type { MoodOption } from "./types";

interface MoodItemProps {
  readonly option: MoodOption;
  readonly isSelected: boolean;
  readonly onSelect: () => void;
}

const PRESS_SCALE = 0.9;
const SELECTED_SCALE = 1.08;
const ITEM_SIZE = 64;
const GRADIENT_OPACITY_SELECTED = 0.25;
const GRADIENT_OPACITY_IDLE = 0.08;

export function MoodItem({ option, isSelected, onSelect }: MoodItemProps) {
  const { colors } = useTheme();
  const scale = useSharedValue(isSelected ? SELECTED_SCALE : 1);
  const gradient = getMoodGradient(option.value);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSelect();
  }, [onSelect]);

  const tapGesture = Gesture.Tap()
    .onBegin(() => {
      scale.value = withSpring(PRESS_SCALE, easing.springBouncy);
    })
    .onFinalize(() => {
      scale.value = withSpring(
        isSelected ? SELECTED_SCALE : 1,
        easing.springBouncy,
      );
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
          styles.item,
          isSelected && [styles.itemSelected, { borderColor: gradient.from }],
          animatedStyle,
        ]}
        accessibilityRole="radio"
        accessibilityState={{ selected: isSelected }}
        accessibilityLabel={option.label}
      >
        <View style={styles.gradientFill}>
          <Canvas style={StyleSheet.absoluteFill}>
            <Rect x={0} y={0} width={ITEM_SIZE} height={ITEM_SIZE}>
              <LinearGradient
                start={vec(0, 0)}
                end={vec(ITEM_SIZE, ITEM_SIZE)}
                colors={[
                  withAlpha(gradient.from, isSelected ? GRADIENT_OPACITY_SELECTED : GRADIENT_OPACITY_IDLE),
                  withAlpha(gradient.to, isSelected ? GRADIENT_OPACITY_SELECTED : GRADIENT_OPACITY_IDLE),
                ]}
              />
            </Rect>
          </Canvas>
        </View>
        <Text style={styles.emoji}>{option.emoji}</Text>
        <AppText
          variant="caption"
          color={isSelected ? colors.textPrimary : colors.textTertiary}
        >
          {option.label}
        </AppText>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  item: {
    alignItems: "center",
    justifyContent: "center",
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: radius.lg,
    gap: 2,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  itemSelected: {
    borderWidth: 1.5,
  },
  gradientFill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  emoji: {
    fontSize: 24,
  },
});
