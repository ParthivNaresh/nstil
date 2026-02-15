import {
  Canvas,
  Circle,
  LinearGradient,
  vec,
} from "@shopify/react-native-skia";
import * as Haptics from "expo-haptics";
import { Plus } from "lucide-react-native";
import { useCallback } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { useTheme } from "@/hooks/useTheme";
import { withAlpha } from "@/lib/colorUtils";
import { easing } from "@/styles";

const BUTTON_SIZE = 52;
const ICON_SIZE = 24;
const PRESS_SCALE = 0.9;
const GLOW_SIZE = BUTTON_SIZE + 12;

interface CreateTabButtonProps {
  readonly onPress: () => void;
}

export function CreateTabButton({ onPress }: CreateTabButtonProps) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(PRESS_SCALE, easing.spring);
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, easing.spring);
  }, [scale]);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  }, [onPress]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowRadius = GLOW_SIZE / 2;
  const buttonRadius = BUTTON_SIZE / 2;

  return (
    <View style={styles.wrapper}>
      <Canvas style={styles.glow} pointerEvents="none">
        <Circle cx={glowRadius} cy={glowRadius} r={glowRadius}>
          <LinearGradient
            start={vec(0, 0)}
            end={vec(GLOW_SIZE, GLOW_SIZE)}
            colors={[
              withAlpha(colors.accent, 0.2),
              withAlpha(colors.accentLight, 0.1),
            ]}
          />
        </Circle>
      </Canvas>
      <Animated.View style={animatedStyle}>
        <Pressable
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          accessibilityRole="button"
          accessibilityLabel="Create new entry"
          style={styles.button}
        >
          <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
            <Circle cx={buttonRadius} cy={buttonRadius} r={buttonRadius}>
              <LinearGradient
                start={vec(0, 0)}
                end={vec(BUTTON_SIZE, BUTTON_SIZE)}
                colors={[colors.accent, colors.accentLight]}
              />
            </Circle>
          </Canvas>
          <Plus size={ICON_SIZE} color="#FFFFFF" strokeWidth={2.5} />
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: -16,
  },
  glow: {
    position: "absolute",
    width: GLOW_SIZE,
    height: GLOW_SIZE,
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
});
