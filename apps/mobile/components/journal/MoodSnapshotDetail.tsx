import { Canvas, LinearGradient, RoundedRect, vec } from "@shopify/react-native-skia";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { useTheme } from "@/hooks/useTheme";
import { withAlpha } from "@/lib/colorUtils";
import { formatFullDate } from "@/lib/formatFullDate";
import { getMoodGradient } from "@/lib/moodColors";
import { getMoodDisplayLabel, getMoodLabel } from "@/lib/moodUtils";
import { radius, spacing } from "@/styles";
import type { JournalEntry } from "@/types";

interface MoodSnapshotDetailProps {
  readonly entry: JournalEntry;
}

const ORB_SIZE = 64;
const BG_OPACITY = 0.1;

export function MoodSnapshotDetail({ entry }: MoodSnapshotDetailProps) {
  const { colors } = useTheme();
  const gradient = entry.mood_category ? getMoodGradient(entry.mood_category) : null;
  const categoryLabel = entry.mood_category ? getMoodLabel(entry.mood_category) : null;
  const displayLabel = getMoodDisplayLabel(entry.mood_category, entry.mood_specific);
  const dateLabel = formatFullDate(entry.created_at);

  return (
    <View style={styles.container}>
      {gradient ? (
        <View style={[styles.orbContainer, { backgroundColor: withAlpha(gradient.from, BG_OPACITY) }]}>
          <Canvas style={styles.orbCanvas}>
            <RoundedRect x={0} y={0} width={ORB_SIZE} height={ORB_SIZE} r={ORB_SIZE / 2}>
              <LinearGradient
                start={vec(0, 0)}
                end={vec(ORB_SIZE, ORB_SIZE)}
                colors={[gradient.from, gradient.to]}
              />
            </RoundedRect>
          </Canvas>
        </View>
      ) : null}

      {displayLabel ? (
        <AppText variant="h2" align="center" color={gradient?.from ?? colors.textPrimary}>
          {displayLabel}
        </AppText>
      ) : null}

      {entry.mood_specific && categoryLabel ? (
        <AppText variant="body" align="center" color={colors.textSecondary}>
          {categoryLabel}
        </AppText>
      ) : null}

      <AppText variant="bodySmall" align="center" color={colors.textTertiary}>
        {dateLabel}
      </AppText>

      {entry.location ? (
        <AppText variant="caption" align="center" color={colors.textTertiary}>
          {entry.location}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.xl,
  },
  orbContainer: {
    width: ORB_SIZE + spacing.lg,
    height: ORB_SIZE + spacing.lg,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  orbCanvas: {
    width: ORB_SIZE,
    height: ORB_SIZE,
  },
});
