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

interface DaySelectorProps {
  readonly activeDays: readonly number[];
  readonly onChange: (days: number[]) => void;
}

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

const IDLE_OPACITY = 0.06;
const SELECTED_OPACITY = 0.2;
const PILL_SIZE = 40;

interface DayPillProps {
  readonly day: number;
  readonly label: string;
  readonly isSelected: boolean;
  readonly onToggle: (day: number) => void;
}

function DayPill({ day, label, isSelected, onToggle }: DayPillProps) {
  const { colors } = useTheme();
  const { size, onLayout, hasSize } = useCanvasSize();

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle(day);
  }, [day, onToggle]);

  const opacity = isSelected ? SELECTED_OPACITY : IDLE_OPACITY;
  const textColor = isSelected ? colors.accent : colors.textTertiary;
  const borderColor = isSelected ? colors.accent : colors.glassBorder;

  return (
    <Pressable
      onPress={handlePress}
      onLayout={onLayout}
      style={[styles.dayPill, { borderColor }]}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: isSelected }}
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
              end={vec(size.width, size.height)}
              colors={[
                withAlpha(colors.accent, opacity),
                withAlpha(colors.accentLight, opacity),
              ]}
            />
          </RoundedRect>
        </Canvas>
      ) : null}
      <AppText variant="label" color={textColor}>
        {label}
      </AppText>
    </Pressable>
  );
}

export function DaySelector({ activeDays, onChange }: DaySelectorProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const handleToggle = useCallback(
    (day: number) => {
      const current = new Set(activeDays);
      if (current.has(day)) {
        current.delete(day);
      } else {
        current.add(day);
      }
      onChange(Array.from(current).sort());
    },
    [activeDays, onChange],
  );

  return (
    <View style={styles.container}>
      <AppText variant="label" color={colors.textSecondary}>
        {t("settings.notifications.activeDays")}
      </AppText>
      <View style={styles.row}>
        {DAY_KEYS.map((key, index) => (
          <DayPill
            key={key}
            day={index}
            label={t(`settings.notifications.days.${key}`)}
            isSelected={activeDays.includes(index)}
            onToggle={handleToggle}
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
    justifyContent: "space-between",
  },
  dayPill: {
    width: PILL_SIZE,
    height: PILL_SIZE,
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
});
