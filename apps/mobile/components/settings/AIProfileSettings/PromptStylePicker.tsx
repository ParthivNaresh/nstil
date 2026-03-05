import {
  Canvas,
  LinearGradient,
  RoundedRect,
  vec,
} from "@shopify/react-native-skia";
import * as Haptics from "expo-haptics";
import { useCallback } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppText } from "@/components/ui";
import { useTheme } from "@/hooks/useTheme";
import { useCanvasSize } from "@/lib/animation";
import { withAlpha } from "@/lib/colorUtils";
import { radius, spacing } from "@/styles";
import type { PromptStyle } from "@/types";

interface PromptStylePickerProps {
  readonly value: PromptStyle;
  readonly onChange: (style: PromptStyle) => void;
  readonly showLabel?: boolean;
}

const STYLES: readonly PromptStyle[] = [
  "gentle",
  "direct",
  "analytical",
  "motivational",
];

const IDLE_OPACITY = 0.06;
const SELECTED_OPACITY = 0.18;

interface StylePillProps {
  readonly style: PromptStyle;
  readonly label: string;
  readonly isSelected: boolean;
  readonly onSelect: (style: PromptStyle) => void;
}

function StylePill({ style, label, isSelected, onSelect }: StylePillProps) {
  const { colors } = useTheme();
  const { size, onLayout, hasSize } = useCanvasSize();

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(style);
  }, [style, onSelect]);

  const opacity = isSelected ? SELECTED_OPACITY : IDLE_OPACITY;
  const textColor = isSelected ? colors.accent : colors.textSecondary;
  const borderColor = isSelected ? colors.accent : colors.glassBorder;

  return (
    <Pressable
      onPress={handlePress}
      onLayout={onLayout}
      style={[styles.pill, { borderColor }]}
      accessibilityRole="radio"
      accessibilityState={{ selected: isSelected }}
      accessibilityLabel={label}
    >
      {hasSize ? (
        <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
          <RoundedRect
            x={0}
            y={0}
            width={size.width}
            height={size.height}
            r={radius.full}
          >
            <LinearGradient
              start={vec(0, 0)}
              end={vec(size.width, 0)}
              colors={[
                withAlpha(colors.accent, opacity),
                withAlpha(colors.accentLight, opacity),
              ]}
            />
          </RoundedRect>
        </Canvas>
      ) : null}
      <AppText variant="caption" color={textColor}>
        {label}
      </AppText>
    </Pressable>
  );
}

export function PromptStylePicker({ value, onChange, showLabel = true }: PromptStylePickerProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      {showLabel ? (
        <AppText variant="label" color={colors.textSecondary}>
          {t("settings.aiProfile.promptStyle")}
        </AppText>
      ) : null}
      <View style={styles.row}>
        {STYLES.map((s) => (
          <StylePill
            key={s}
            style={s}
            label={t(`settings.aiProfile.styles.${s}`)}
            isSelected={value === s}
            onSelect={onChange}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.full,
    borderWidth: 1,
    overflow: "hidden",
  },
});
