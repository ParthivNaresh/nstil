import { useCallback } from "react";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { Card } from "@/components/ui/Card";
import { formatRelativeDate } from "@/lib/formatRelativeDate";
import { getMoodEmoji } from "@/lib/moodUtils";
import { colors, radius, spacing } from "@/styles";

import type { EntryCardProps } from "./types";

const BODY_PREVIEW_LINES = 2;

export function EntryCard({ entry, onPress }: EntryCardProps) {
  const handlePress = useCallback(() => {
    onPress(entry.id);
  }, [entry.id, onPress]);

  const emoji = getMoodEmoji(entry.mood_score);
  const displayTitle = entry.title || null;
  const relativeDate = formatRelativeDate(entry.created_at);

  return (
    <Card onPress={handlePress} accessibilityLabel={displayTitle ?? entry.body}>
      <View style={styles.header}>
        {emoji ? (
          <AppText variant="h3" style={styles.emoji}>
            {emoji}
          </AppText>
        ) : null}
        <View style={styles.headerText}>
          {displayTitle ? (
            <AppText variant="label" numberOfLines={1}>
              {displayTitle}
            </AppText>
          ) : null}
          <AppText variant="caption" color={colors.textTertiary}>
            {relativeDate}
          </AppText>
        </View>
      </View>

      <AppText
        variant="body"
        color={colors.textSecondary}
        numberOfLines={BODY_PREVIEW_LINES}
        style={styles.body}
      >
        {entry.body}
      </AppText>

      {entry.tags.length > 0 ? (
        <View style={styles.tags}>
          {entry.tags.map((tag) => (
            <View key={tag} style={styles.tag}>
              <AppText variant="caption" color={colors.accentLight}>
                {tag}
              </AppText>
            </View>
          ))}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  emoji: {
    lineHeight: 28,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  body: {
    marginBottom: spacing.xs,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  tag: {
    backgroundColor: colors.accentMuted,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
});
