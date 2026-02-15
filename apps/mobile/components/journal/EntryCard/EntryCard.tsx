import { Canvas, LinearGradient, RoundedRect, vec } from "@shopify/react-native-skia";
import { Pin } from "lucide-react-native";
import { useCallback } from "react";
import { View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { useTheme } from "@/hooks/useTheme";
import { withAlpha } from "@/lib/colorUtils";
import { formatRelativeDate } from "@/lib/formatRelativeDate";
import { getMoodGradient } from "@/lib/moodColors";
import { getMoodDisplayLabel } from "@/lib/moodUtils";

import { MoodAccent } from "./MoodAccent";
import { styles } from "./styles";
import type { EntryCardProps } from "./types";

const BODY_PREVIEW_LINES = 2;
const DOT_SIZE = 6;
const BADGE_BG_OPACITY = 0.1;

export function EntryCard({ entry, onPress }: EntryCardProps) {
  const { colors } = useTheme();
  const relativeDate = formatRelativeDate(entry.created_at);
  const hasMood = entry.mood_category !== null;
  const moodLabel = getMoodDisplayLabel(entry.mood_category, entry.mood_specific);
  const gradient = hasMood ? getMoodGradient(entry.mood_category) : null;

  const handlePress = useCallback(() => {
    onPress(entry.id);
  }, [entry.id, onPress]);

  return (
    <Card onPress={handlePress} style={styles.card}>
      {hasMood ? <MoodAccent moodCategory={entry.mood_category} /> : null}

      <View style={[styles.inner, hasMood && styles.innerWithAccent]}>
        <View style={styles.topRow}>
          <View style={styles.topLeft}>
            {entry.is_pinned ? (
              <Icon icon={Pin} size="xs" color={colors.accent} />
            ) : null}
            <AppText variant="caption" color={colors.textTertiary}>
              {relativeDate}
            </AppText>
          </View>
          {gradient && moodLabel ? (
            <View
              style={[
                styles.moodBadge,
                { backgroundColor: withAlpha(gradient.from, BADGE_BG_OPACITY) },
              ]}
            >
              <View style={styles.moodDotContainer}>
                <Canvas style={styles.moodDotCanvas}>
                  <RoundedRect
                    x={0}
                    y={0}
                    width={DOT_SIZE}
                    height={DOT_SIZE}
                    r={DOT_SIZE / 2}
                  >
                    <LinearGradient
                      start={vec(0, 0)}
                      end={vec(DOT_SIZE, DOT_SIZE)}
                      colors={[gradient.from, gradient.to]}
                    />
                  </RoundedRect>
                </Canvas>
              </View>
              <AppText variant="caption" color={gradient.from}>
                {moodLabel}
              </AppText>
            </View>
          ) : null}
        </View>

        {entry.title ? (
          <AppText variant="label" numberOfLines={1}>
            {entry.title}
          </AppText>
        ) : null}

        <AppText
          variant="body"
          color={colors.textSecondary}
          numberOfLines={BODY_PREVIEW_LINES}
        >
          {entry.body}
        </AppText>

        {entry.tags.length > 0 ? (
          <View style={styles.tags}>
            {entry.tags.map((tag) => (
              <View
                key={tag}
                style={[styles.tagPill, { backgroundColor: colors.accentMuted }]}
              >
                <AppText variant="caption" color={colors.accentLight}>
                  {tag}
                </AppText>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </Card>
  );
}
