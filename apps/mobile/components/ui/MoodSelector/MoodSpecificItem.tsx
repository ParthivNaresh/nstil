import * as Haptics from "expo-haptics";
import {
  Canvas,
  LinearGradient,
  RoundedRect,
  vec,
} from "@shopify/react-native-skia";
import { useCallback, useState } from "react";
import { Pressable, StyleSheet, type LayoutChangeEvent } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { useTheme } from "@/hooks/useTheme";
import { withAlpha } from "@/lib/colorUtils";
import { getMoodGradient } from "@/lib/moodColors";
import { getMoodSpecificLabel } from "@/lib/moodUtils";
import { radius, spacing } from "@/styles";
import type { MoodCategory, MoodSpecific } from "@/types";

interface MoodSpecificItemProps {
  readonly category: MoodCategory;
  readonly specific: MoodSpecific;
  readonly isSelected: boolean;
  readonly onSelect: (specific: MoodSpecific) => void;
}

const IDLE_OPACITY = 0.06;
const SELECTED_OPACITY = 0.18;
const PILL_RADIUS = 999;

export function MoodSpecificItem({
  category,
  specific,
  isSelected,
  onSelect,
}: MoodSpecificItemProps) {
  const { colors } = useTheme();
  const gradient = getMoodGradient(category);
  const label = getMoodSpecificLabel(specific);
  const [size, setSize] = useState({ width: 0, height: 0 });

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(specific);
  }, [specific, onSelect]);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize({ width, height });
  }, []);

  const opacity = isSelected ? SELECTED_OPACITY : IDLE_OPACITY;
  const textColor = isSelected ? gradient.from : colors.textSecondary;
  const borderColor = isSelected ? gradient.from : colors.glassBorder;

  return (
    <Pressable
      onPress={handlePress}
      onLayout={handleLayout}
      style={[styles.pill, { borderColor }]}
      accessibilityRole="radio"
      accessibilityState={{ selected: isSelected }}
      accessibilityLabel={label ?? specific}
    >
      {size.width > 0 ? (
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
        {label ?? specific}
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
