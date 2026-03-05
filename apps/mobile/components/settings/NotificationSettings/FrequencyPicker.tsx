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
import type { ReminderFrequency } from "@/types";

interface FrequencyPickerProps {
  readonly value: ReminderFrequency;
  readonly onChange: (frequency: ReminderFrequency) => void;
}

const FREQUENCIES: readonly ReminderFrequency[] = [
  "daily",
  "twice_daily",
  "weekdays",
  "custom",
];

const IDLE_OPACITY = 0.06;
const SELECTED_OPACITY = 0.18;

interface FrequencyPillProps {
  readonly frequency: ReminderFrequency;
  readonly label: string;
  readonly isSelected: boolean;
  readonly onSelect: (frequency: ReminderFrequency) => void;
}

function FrequencyPill({ frequency, label, isSelected, onSelect }: FrequencyPillProps) {
  const { colors } = useTheme();
  const { size, onLayout, hasSize } = useCanvasSize();

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(frequency);
  }, [frequency, onSelect]);

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

export function FrequencyPicker({ value, onChange }: FrequencyPickerProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <AppText variant="label" color={colors.textSecondary}>
        {t("settings.notifications.frequency")}
      </AppText>
      <View style={styles.row}>
        {FREQUENCIES.map((freq) => (
          <FrequencyPill
            key={freq}
            frequency={freq}
            label={t(`settings.notifications.frequencies.${freq}`)}
            isSelected={value === freq}
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
