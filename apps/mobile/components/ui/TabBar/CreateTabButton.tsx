import {
  Canvas,
  Circle,
  LinearGradient,
  vec,
} from "@shopify/react-native-skia";
import * as Haptics from "expo-haptics";
import { Plus } from "lucide-react-native";
import { useCallback, useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { useTheme } from "@/hooks/useTheme";
import { withAlpha } from "@/lib/colorUtils";
import { easing } from "@/styles";

const BUTTON_SIZE = 52;
const ICON_SIZE = 24;
const PRESS_SCALE = 0.9;
const GLOW_SIZE = BUTTON_SIZE + 12;
const BORDER_WIDTH = 1.5;
const ROTATION_DEG = 45;

interface CreateTabButtonProps {
  readonly onPress: () => void;
  readonly isMenuOpen?: boolean;
}

export function CreateTabButton({ onPress, isMenuOpen = false }: CreateTabButtonProps) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withTiming(isMenuOpen ? ROTATION_DEG : 0, {
      duration: 200,
      easing: Easing.out(Easing.cubic),
    });
  }, [isMenuOpen, rotation]);

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
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  const glowCenter = GLOW_SIZE / 2;
  const buttonCenter = BUTTON_SIZE / 2;

  return (
    <View style={styles.wrapper}>
      <Canvas style={styles.glow} pointerEvents="none">
        <Circle cx={glowCenter} cy={glowCenter} r={glowCenter}>
          <LinearGradient
            start={vec(0, 0)}
            end={vec(GLOW_SIZE, GLOW_SIZE)}
            colors={[
              withAlpha(colors.accent, 0.15),
              withAlpha(colors.accentLight, 0.06),
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
            <Circle cx={buttonCenter} cy={buttonCenter} r={buttonCenter}>
              <LinearGradient
                start={vec(0, 0)}
                end={vec(BUTTON_SIZE, BUTTON_SIZE)}
                colors={[
                  withAlpha(colors.surface, 0.85),
                  withAlpha(colors.accent, 0.12),
                ]}
              />
            </Circle>
            <Circle
              cx={buttonCenter}
              cy={buttonCenter}
              r={buttonCenter - BORDER_WIDTH / 2}
              style="stroke"
              strokeWidth={BORDER_WIDTH}
              color={withAlpha(colors.accent, 0.35)}
            />
          </Canvas>
          <Plus size={ICON_SIZE} color={colors.accent} strokeWidth={2.5} />
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
