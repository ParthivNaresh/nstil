import { Calendar, FileText, MapPin } from "lucide-react-native";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppText, Icon } from "@/components/ui";
import { useTheme } from "@/hooks/useTheme";
import { formatFullDate } from "@/lib/formatFullDate";
import { radius, spacing } from "@/styles";

import { MoodBanner } from "./MoodBanner";
import type { EntryDetailContentProps } from "./types";

export function EntryDetailContent({ entry }: EntryDetailContentProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const formattedDate = formatFullDate(entry.created_at);
  const entryTypeLabel = t(`journal.entryTypes.${entry.entry_type}`);
  const hasMood = entry.mood_score !== null;

  return (
    <View style={styles.container}>
      {hasMood ? <MoodBanner moodScore={entry.mood_score!} /> : null}

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Icon icon={Calendar} size="xs" color={colors.textTertiary} />
          <AppText variant="caption" color={colors.textTertiary}>
            {formattedDate}
          </AppText>
        </View>
        <View style={[styles.metaBadge, { backgroundColor: colors.accentMuted }]}>
          <Icon icon={FileText} size="xs" color={colors.accentLight} />
          <AppText variant="caption" color={colors.accentLight}>
            {entryTypeLabel}
          </AppText>
        </View>
        {entry.location ? (
          <View style={styles.metaItem}>
            <Icon icon={MapPin} size="xs" color={colors.textTertiary} />
            <AppText variant="caption" color={colors.textTertiary}>
              {entry.location}
            </AppText>
          </View>
        ) : null}
      </View>

      {entry.title ? (
        <AppText variant="h2">{entry.title}</AppText>
      ) : null}

      <AppText variant="body" color={colors.textSecondary}>
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
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  metaBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  tagPill: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.xs + 1,
  },
});
