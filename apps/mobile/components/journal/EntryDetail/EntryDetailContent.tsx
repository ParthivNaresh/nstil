import { MapPin } from "lucide-react-native";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppText, Icon } from "@/components/ui";
import { formatFullDate } from "@/lib/formatFullDate";
import { getMoodEmoji, getMoodLabel } from "@/lib/moodUtils";
import { colors, radius, spacing } from "@/styles";

import type { EntryDetailContentProps } from "./types";

export function EntryDetailContent({ entry }: EntryDetailContentProps) {
  const { t } = useTranslation();
  const emoji = getMoodEmoji(entry.mood_score);
  const moodLabel = getMoodLabel(entry.mood_score);
  const formattedDate = formatFullDate(entry.created_at);
  const entryTypeLabel = t(`journal.entryTypes.${entry.entry_type}`);

  return (
    <View style={styles.container}>
      <View style={styles.meta}>
        <AppText variant="caption" color={colors.textTertiary}>
          {formattedDate}
        </AppText>
        <View style={styles.typeBadge}>
          <AppText variant="caption" color={colors.accentLight}>
            {entryTypeLabel}
          </AppText>
        </View>
      </View>

      {emoji && moodLabel ? (
        <View style={styles.mood}>
          <AppText variant="h2">{emoji}</AppText>
          <AppText variant="body" color={colors.textSecondary}>
            {moodLabel}
          </AppText>
        </View>
      ) : null}

      {entry.title ? (
        <AppText variant="h2">{entry.title}</AppText>
      ) : null}

      <AppText variant="body" color={colors.textSecondary} style={styles.body}>
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

      {entry.location ? (
        <View style={styles.location}>
          <Icon icon={MapPin} size="xs" color={colors.textTertiary} />
          <AppText variant="caption" color={colors.textTertiary}>
            {entry.location}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  typeBadge: {
    backgroundColor: colors.accentMuted,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  mood: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  body: {
    lineHeight: 24,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  tag: {
    backgroundColor: colors.accentMuted,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  location: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
});
