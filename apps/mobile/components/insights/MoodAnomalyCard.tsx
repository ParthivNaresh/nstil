import { TrendingDown, TrendingUp } from "lucide-react-native";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppText, Card, Icon } from "@/components/ui";
import { useTheme } from "@/hooks/useTheme";
import type { MoodAnomalyData } from "@/lib/insightUtils";
import { spacing } from "@/styles";
import type { AIInsight } from "@/types";

interface MoodAnomalyCardProps {
  readonly insight: AIInsight;
  readonly data: MoodAnomalyData;
}

export function MoodAnomalyCard({ insight, data }: MoodAnomalyCardProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const isPositive = data.direction === "positive";
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;
  const iconColor = isPositive ? "#27AE60" : "#E55039";

  return (
    <Card>
      <View style={styles.container}>
        <View style={styles.header}>
          <Icon icon={TrendIcon} size="md" color={iconColor} />
          <AppText variant="h3" color={colors.textPrimary} style={styles.title}>
            {insight.title}
          </AppText>
        </View>
        <AppText variant="body" color={colors.textSecondary}>
          {insight.content}
        </AppText>
        <AppText variant="caption" color={colors.textTertiary}>
          {t("insights.confidenceLabel", {
            value: Math.round(data.difference * 100),
          })}
        </AppText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  title: {
    flex: 1,
  },
});
