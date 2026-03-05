import * as Haptics from "expo-haptics";
import {
  Canvas,
  LinearGradient,
  RoundedRect,
  vec,
} from "@shopify/react-native-skia";
import { useCallback } from "react";
import { Pressable, StyleSheet } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { useTheme } from "@/hooks/useTheme";
import { useCanvasSize } from "@/lib/animation";
import { withAlpha } from "@/lib/colorUtils";
import { getMoodGradient } from "@/lib/moodColors";
import { getMoodLabel } from "@/lib/moodUtils";
import { radius, spacing } from "@/styles";
import type { MoodCategory } from "@/types";

interface MoodItemProps {
  readonly category: MoodCategory;
  readonly isSelected: boolean;
  readonly onSelect: (category: MoodCategory) => void;
}

const IDLE_OPACITY = 0.08;
const SELECTED_OPACITY = 0.2;
const PILL_RADIUS = 999;

export function MoodItem({ category, isSelected, onSelect }: MoodItemProps) {
  const { colors } = useTheme();
  const gradient = getMoodGradient(category);
  const label = getMoodLabel(category);
  const { size, onLayout, hasSize } = useCanvasSize();

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(category);
  }, [category, onSelect]);

  const opacity = isSelected ? SELECTED_OPACITY : IDLE_OPACITY;
  const textColor = isSelected ? gradient.from : colors.textSecondary;
  const borderColor = isSelected ? gradient.from : colors.glassBorder;

  return (
    <Pressable
      onPress={handlePress}
      onLayout={onLayout}
      style={[styles.pill, { borderColor }]}
      accessibilityRole="radio"
      accessibilityState={{ selected: isSelected }}
      accessibilityLabel={label ?? category}
    >
      {hasSize ? (
        <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
          <RoundedRect
            x={0}
            y={0}
            width={size.width}
            height={size.height}
            r={PILL_RADIUS}
          >
            <LinearGradient
              start={vec(0, 0)}
              end={vec(size.width, 0)}
              colors={[
                withAlpha(gradient.from, opacity),
                withAlpha(gradient.to, opacity),
              ]}
            />
          </RoundedRect>
        </Canvas>
      ) : null}
      <AppText variant="caption" color={textColor}>
        {label ?? category}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.full,
    borderWidth: 1,
    overflow: "hidden",
  },
});
