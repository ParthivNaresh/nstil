import { useCallback } from "react";
import { View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { Card } from "@/components/ui/Card";
import { useTheme } from "@/hooks/useTheme";

import { styles } from "./styles";
import type { JournalCardProps } from "./types";

const DESCRIPTION_LINES = 1;

export function JournalCard({ journal, onPress }: JournalCardProps) {
  const { colors } = useTheme();

  const handlePress = useCallback(() => {
    onPress(journal.id);
  }, [journal.id, onPress]);

  const dotColor = journal.color ?? colors.accent;

  return (
    <Card onPress={handlePress} showChevron>
      <View style={styles.inner}>
        <View style={styles.topRow}>
          <View style={[styles.colorDot, { backgroundColor: dotColor }]} />
          <View style={styles.nameContainer}>
            <AppText variant="label" numberOfLines={1}>
              {journal.name}
            </AppText>
          </View>
        </View>
        {journal.description ? (
          <AppText
            variant="bodySmall"
            color={colors.textTertiary}
            numberOfLines={DESCRIPTION_LINES}
          >
            {journal.description}
          </AppText>
        ) : null}
      </View>
    </Card>
  );
}
