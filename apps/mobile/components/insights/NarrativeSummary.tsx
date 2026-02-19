import { BookOpen, X } from "lucide-react-native";
import { useCallback } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import { AppText, Card, Icon } from "@/components/ui";
import { useTheme } from "@/hooks/useTheme";
import { spacing } from "@/styles";
import type { AIInsight } from "@/types";

interface NarrativeSummaryProps {
  readonly insight: AIInsight;
  readonly onDismiss: (id: string) => void;
}

const FADE_DURATION_MS = 400;

export function NarrativeSummary({ insight, onDismiss }: NarrativeSummaryProps) {
  const { colors } = useTheme();

  const handleDismiss = useCallback(() => {
    onDismiss(insight.id);
  }, [insight.id, onDismiss]);

  return (
    <Animated.View entering={FadeIn.duration(FADE_DURATION_MS)}>
      <Card variant="glass" style={styles.card}>
        <View style={styles.header}>
          <View style={styles.labelRow}>
            <Icon icon={BookOpen} size="xs" color={colors.accent} />
            <AppText variant="caption" style={{ color: colors.accent }}>
              {insight.title}
            </AppText>
          </View>
          <Pressable
            onPress={handleDismiss}
            hitSlop={12}
            accessibilityLabel="Dismiss narrative"
          >
            <Icon icon={X} size="xs" color={colors.textTertiary} />
          </Pressable>
        </View>
        <AppText variant="body" style={{ color: colors.textSecondary }}>
          {insight.content}
        </AppText>
      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
});
