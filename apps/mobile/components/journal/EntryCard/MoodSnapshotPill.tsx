import { Canvas, LinearGradient, RoundedRect, vec } from "@shopify/react-native-skia";
import { useCallback } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { useTheme } from "@/hooks/useTheme";
import { withAlpha } from "@/lib/colorUtils";
import { formatRelativeDate } from "@/lib/formatRelativeDate";
import { getMoodGradient } from "@/lib/moodColors";
import { getMoodDisplayLabel } from "@/lib/moodUtils";
import { radius, spacing } from "@/styles";
import type { JournalEntry } from "@/types";

interface MoodSnapshotPillProps {
  readonly entry: JournalEntry;
  readonly onPress: (id: string) => void;
}

const DOT_SIZE = 8;
const BG_OPACITY = 0.08;
const BORDER_OPACITY = 0.15;

export function MoodSnapshotPill({ entry, onPress }: MoodSnapshotPillProps) {
  const { colors } = useTheme();
  const gradient = entry.mood_category ? getMoodGradient(entry.mood_category) : null;
  const label = getMoodDisplayLabel(entry.mood_category, entry.mood_specific);
  const timeLabel = formatRelativeDate(entry.created_at);

  const handlePress = useCallback(() => {
    onPress(entry.id);
  }, [entry.id, onPress]);

  const borderColor = gradient ? withAlpha(gradient.from, BORDER_OPACITY) : colors.glassBorder;
  const bgColor = gradient ? withAlpha(gradient.from, BG_OPACITY) : "transparent";

  return (
    <Pressable
      onPress={handlePress}
      style={[styles.pill, { borderColor, backgroundColor: bgColor }]}
      accessibilityRole="button"
      accessibilityLabel={label ? `${label}, ${timeLabel}` : timeLabel}
    >
      {gradient ? (
        <View style={styles.dotContainer}>
          <Canvas style={styles.dotCanvas}>
            <RoundedRect x={0} y={0} width={DOT_SIZE} height={DOT_SIZE} r={DOT_SIZE / 2}>
              <LinearGradient
                start={vec(0, 0)}
                end={vec(DOT_SIZE, DOT_SIZE)}
                colors={[gradient.from, gradient.to]}
              />
            </RoundedRect>
          </Canvas>
        </View>
      ) : null}
      {label ? (
        <AppText variant="caption" color={gradient?.from ?? colors.textSecondary}>
          {label}
        </AppText>
      ) : null}
      <AppText variant="caption" color={colors.textTertiary}>
        {timeLabel}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.full,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  dotContainer: {
    width: DOT_SIZE,
    height: DOT_SIZE,
  },
  dotCanvas: {
    width: DOT_SIZE,
    height: DOT_SIZE,
  },
});
