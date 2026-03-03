import { Check } from "lucide-react-native";
import { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useTranslation } from "react-i18next";

import { AppText, Button, Icon, MoodSelector } from "@/components/ui";
import { useTheme } from "@/hooks/useTheme";
import { withAlpha } from "@/lib/colorUtils";
import { radius, spacing } from "@/styles";
import type { MoodCategory, MoodSpecific } from "@/types";

interface BreathingCompleteProps {
  readonly cyclesCompleted: number;
  readonly onDone: (moodAfter: MoodCategory | null) => void;
}

const FADE_DURATION = 400;
const CIRCLE_OUTER = 96;
const CIRCLE_INNER = 64;

export function BreathingComplete({ cyclesCompleted, onDone }: BreathingCompleteProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [moodCategory, setMoodCategory] = useState<MoodCategory | null>(null);
  const [moodSpecific, setMoodSpecific] = useState<MoodSpecific | null>(null);

  const handleDone = useCallback(() => {
    onDone(moodCategory);
  }, [moodCategory, onDone]);

  const handleCategoryChange = useCallback((category: MoodCategory) => {
    setMoodCategory(category);
    setMoodSpecific(null);
  }, []);

  const handleSpecificChange = useCallback((specific: MoodSpecific) => {
    setMoodSpecific(specific);
  }, []);

  return (
    <Animated.View
      entering={FadeIn.duration(FADE_DURATION)}
      style={styles.container}
    >
      <View style={styles.content}>
        <View
          style={[
            styles.checkCircle,
            { backgroundColor: withAlpha(colors.success, 0.15) },
          ]}
        >
          <View
            style={[
              styles.checkInner,
              { backgroundColor: withAlpha(colors.success, 0.3) },
            ]}
          >
            <Icon icon={Check} size="lg" color={colors.success} />
          </View>
        </View>

        <AppText variant="h2" color={colors.textPrimary}>
          {t("breathing.complete.title")}
        </AppText>
        <AppText variant="body" color={colors.textSecondary}>
          {t("breathing.complete.subtitle", { cycles: cyclesCompleted })}
        </AppText>
      </View>

      <View style={styles.moodSection}>
        <AppText variant="caption" color={colors.textSecondary}>
          {t("breathing.complete.moodPrompt")}
        </AppText>
        <MoodSelector
          category={moodCategory}
          specific={moodSpecific}
          onCategoryChange={handleCategoryChange}
          onSpecificChange={handleSpecificChange}
        />
      </View>

      <View style={styles.footer}>
        <Button
          title={t("breathing.complete.done")}
          onPress={handleDone}
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
  content: {
    alignItems: "center",
    gap: spacing.md,
  },
  checkCircle: {
    width: CIRCLE_OUTER,
    height: CIRCLE_OUTER,
    borderRadius: radius.full,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  checkInner: {
    width: CIRCLE_INNER,
    height: CIRCLE_INNER,
    borderRadius: radius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  moodSection: {
    gap: spacing.sm,
  },
  footer: {
    gap: spacing.md,
  },
});
