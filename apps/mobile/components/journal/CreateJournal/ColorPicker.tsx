import {
  Canvas,
  Circle,
  LinearGradient,
  vec,
} from "@shopify/react-native-skia";
import * as Haptics from "expo-haptics";
import { Check } from "lucide-react-native";
import { useCallback } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { useTheme } from "@/hooks/useTheme";
import { withAlpha } from "@/lib/colorUtils";
import { JOURNAL_COLOR_PRESETS } from "@/lib/journalColors";
import { spacing } from "@/styles";

const SWATCH_SIZE = 40;
const CHECK_SIZE = 18;
const BORDER_WIDTH = 2;

interface ColorPickerProps {
  readonly selectedColor: string;
  readonly onSelect: (hex: string) => void;
}

export function ColorPicker({ selectedColor, onSelect }: ColorPickerProps) {
  const { colors } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={localStyles.container}
    >
      {JOURNAL_COLOR_PRESETS.map((preset) => (
        <ColorSwatch
          key={preset.hex}
          hex={preset.hex}
          label={preset.label}
          isSelected={selectedColor === preset.hex}
          onPress={onSelect}
          checkColor={colors.background}
        />
      ))}
    </ScrollView>
  );
}

interface ColorSwatchProps {
  readonly hex: string;
  readonly label: string;
  readonly isSelected: boolean;
  readonly onPress: (hex: string) => void;
  readonly checkColor: string;
}

function ColorSwatch({ hex, label, isSelected, onPress, checkColor }: ColorSwatchProps) {
  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress(hex);
  }, [hex, onPress]);

  const center = SWATCH_SIZE / 2;

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="radio"
      accessibilityState={{ selected: isSelected }}
      accessibilityLabel={label}
      style={localStyles.swatch}
    >
      <Canvas style={localStyles.canvas} pointerEvents="none">
        <Circle cx={center} cy={center} r={center}>
          <LinearGradient
            start={vec(0, 0)}
            end={vec(SWATCH_SIZE, SWATCH_SIZE)}
            colors={[hex, withAlpha(hex, 0.7)]}
          />
        </Circle>
        {isSelected ? (
          <Circle
            cx={center}
            cy={center}
            r={center - BORDER_WIDTH / 2}
            style="stroke"
            strokeWidth={BORDER_WIDTH}
            color="white"
          />
        ) : null}
      </Canvas>
      {isSelected ? (
        <View style={localStyles.checkOverlay}>
          <Check size={CHECK_SIZE} color={checkColor} strokeWidth={3} />
        </View>
      ) : null}
    </Pressable>
  );
}

const localStyles = StyleSheet.create({
  container: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  swatch: {
    width: SWATCH_SIZE,
    height: SWATCH_SIZE,
    borderRadius: SWATCH_SIZE / 2,
  },
  canvas: {
    width: SWATCH_SIZE,
    height: SWATCH_SIZE,
  },
  checkOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
});
