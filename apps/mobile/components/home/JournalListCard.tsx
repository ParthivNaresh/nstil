import { useRouter } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import { useCallback } from "react";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { useTheme } from "@/hooks/useTheme";
import { spacing } from "@/styles";
import type { JournalSpace } from "@/types";

const MAX_VISIBLE_DOTS = 5;
const DOT_SIZE = 10;

interface JournalListCardProps {
  readonly journals: JournalSpace[];
  readonly label: string;
  readonly actionLabel: string;
}

export function JournalListCard({ journals, label, actionLabel }: JournalListCardProps) {
  const { colors } = useTheme();
  const router = useRouter();

  const handlePress = useCallback(() => {
    router.push("/journal/list");
  }, [router]);

  const visibleJournals = journals.slice(0, MAX_VISIBLE_DOTS);
  const overflowCount = Math.max(0, journals.length - MAX_VISIBLE_DOTS);

  return (
    <Card onPress={handlePress}>
      <View style={localStyles.container}>
        <View style={localStyles.left}>
          <AppText variant="label">{label}</AppText>
          <View style={localStyles.dotsRow}>
            {visibleJournals.map((journal) => (
              <View
                key={journal.id}
                style={[
                  localStyles.dot,
                  { backgroundColor: journal.color ?? colors.accent },
                ]}
              />
            ))}
            {overflowCount > 0 ? (
              <AppText variant="caption" color={colors.textTertiary}>
                +{overflowCount}
              </AppText>
            ) : null}
          </View>
        </View>
        <View style={localStyles.right}>
          <AppText variant="caption" color={colors.textTertiary}>
            {actionLabel}
          </AppText>
          <Icon icon={ChevronRight} size="xs" color={colors.textTertiary} />
        </View>
      </View>
    </Card>
  );
}

const localStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
  left: {
    flex: 1,
    gap: spacing.sm,
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
});
