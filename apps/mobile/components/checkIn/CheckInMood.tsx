import { useCallback } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useTranslation } from "react-i18next";

import { AppText, Button, MoodSelector } from "@/components/ui";
import { useTheme } from "@/hooks/useTheme";
import { spacing } from "@/styles";
import type { MoodCategory, MoodSpecific } from "@/types";

interface CheckInMoodProps {
  readonly category: MoodCategory | null;
  readonly specific: MoodSpecific | null;
  readonly onCategoryChange: (category: MoodCategory) => void;
  readonly onSpecificChange: (specific: MoodSpecific) => void;
  readonly onContinue: () => void;
}

const FADE_DURATION = 300;

export function CheckInMood({
  category,
  specific,
  onCategoryChange,
  onSpecificChange,
  onContinue,
}: CheckInMoodProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const handleContinue = useCallback(() => {
    if (category) {
      onContinue();
    }
  }, [category, onContinue]);

  return (
    <Animated.View
      entering={FadeIn.duration(FADE_DURATION)}
      style={styles.container}
    >
      <View style={styles.header}>
        <AppText variant="h2" color={colors.textPrimary}>
          {t("checkIn.moodTitle")}
        </AppText>
        <AppText variant="body" color={colors.textSecondary}>
          {t("checkIn.moodSubtitle")}
        </AppText>
      </View>

      <View style={styles.selector}>
        <MoodSelector
          category={category}
          specific={specific}
          onCategoryChange={onCategoryChange}
          onSpecificChange={onSpecificChange}
        />
      </View>

      <View style={styles.footer}>
        <Button
          title={t("checkIn.continue")}
          onPress={handleContinue}
          disabled={category === null}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  header: {
    gap: spacing.sm,
    alignItems: "center",
  },
  selector: {
    alignItems: "center",
  },
  footer: {
    gap: spacing.md,
  },
});
