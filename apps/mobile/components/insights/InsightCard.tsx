import { Bookmark, X } from "lucide-react-native";
import { useCallback } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useTranslation } from "react-i18next";

import { AppText, Card, Icon } from "@/components/ui";
import { useTheme } from "@/hooks/useTheme";
import { spacing } from "@/styles";
import type { AIInsight } from "@/types";

interface InsightCardProps {
  readonly insight: AIInsight;
  readonly onDismiss: (id: string) => void;
  readonly onBookmark: (id: string) => void;
}

const FADE_DURATION = 200;

export function InsightCard({ insight, onDismiss, onBookmark }: InsightCardProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const isBookmarked = insight.status === "bookmarked";

  const handleDismiss = useCallback(() => {
    onDismiss(insight.id);
  }, [insight.id, onDismiss]);

  const handleBookmark = useCallback(() => {
    onBookmark(insight.id);
  }, [insight.id, onBookmark]);

  return (
    <Animated.View
      entering={FadeIn.duration(FADE_DURATION)}
      exiting={FadeOut.duration(FADE_DURATION)}
    >
      <Card>
        <View style={styles.container}>
          <View style={styles.header}>
            <AppText variant="h3" color={colors.textPrimary} style={styles.title}>
              {insight.title}
            </AppText>
            <View style={styles.actions}>
              <Pressable onPress={handleBookmark} hitSlop={8}>
                <Icon
                  icon={Bookmark}
                  size="sm"
                  color={isBookmarked ? colors.accent : colors.textTertiary}
                />
              </Pressable>
              <Pressable onPress={handleDismiss} hitSlop={8}>
                <Icon icon={X} size="sm" color={colors.textTertiary} />
              </Pressable>
            </View>
          </View>
          <AppText variant="body" color={colors.textSecondary}>
            {insight.content}
          </AppText>
          {insight.period_start && insight.period_end ? (
            <AppText variant="caption" color={colors.textTertiary}>
              {t("insights.period", {
                start: new Date(insight.period_start).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                }),
                end: new Date(insight.period_end).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                }),
              })}
            </AppText>
          ) : null}
        </View>
      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  title: {
    flex: 1,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
});
