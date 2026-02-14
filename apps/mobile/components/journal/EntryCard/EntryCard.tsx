import { Pin } from "lucide-react-native";
import { useCallback } from "react";
import { View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { useTheme } from "@/hooks/useTheme";
import { formatRelativeDate } from "@/lib/formatRelativeDate";
import { getMoodEmoji } from "@/lib/moodUtils";

import { MoodAccent } from "./MoodAccent";
import { styles } from "./styles";
import type { EntryCardProps } from "./types";

const BODY_PREVIEW_LINES = 2;

export function EntryCard({ entry, onPress }: EntryCardProps) {
  const { colors } = useTheme();
  const emoji = entry.mood_score ? getMoodEmoji(entry.mood_score) : null;
  const relativeDate = formatRelativeDate(entry.created_at);
  const hasMood = entry.mood_score !== null;

  const handlePress = useCallback(() => {
    onPress(entry.id);
  }, [entry.id, onPress]);

  return (
    <Card onPress={handlePress} style={styles.card}>
      {hasMood ? <MoodAccent moodScore={entry.mood_score} /> : null}

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
          {emoji ? <AppText variant="body">{emoji}</AppText> : null}
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
