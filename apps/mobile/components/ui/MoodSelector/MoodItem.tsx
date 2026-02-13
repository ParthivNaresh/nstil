import * as Haptics from "expo-haptics";
import { useCallback } from "react";
import { StyleSheet, Text } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

import { AppText } from "@/components/ui/AppText";
import { colors, easing, radius, spacing } from "@/styles";

import type { MoodOption } from "./types";

interface MoodItemProps {
  option: MoodOption;
  isSelected: boolean;
  onSelect: () => void;
}

const PRESS_SCALE = 0.9;
const SELECTED_SCALE = 1.15;

export function MoodItem({ option, isSelected, onSelect }: MoodItemProps) {
  const scale = useSharedValue(isSelected ? SELECTED_SCALE : 1);

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
          isSelected && styles.selected,
          animatedStyle,
        ]}
        accessibilityRole="radio"
        accessibilityState={{ selected: isSelected }}
        accessibilityLabel={option.label}
      >
        <Text style={styles.emoji}>{option.emoji}</Text>
        <AppText
          variant="caption"
          color={isSelected ? colors.accent : colors.textTertiary}
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
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    gap: 2,
    minWidth: 56,
  },
  selected: {
    backgroundColor: colors.accentMuted,
  },
  emoji: {
    fontSize: 28,
  },
});
