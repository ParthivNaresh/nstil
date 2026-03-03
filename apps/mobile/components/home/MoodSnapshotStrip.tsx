import * as Haptics from "expo-haptics";
import { Check } from "lucide-react-native";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  FadeOutUp,
  LinearTransition,
} from "react-native-reanimated";
import { useTranslation } from "react-i18next";

import { AppText, Icon } from "@/components/ui";
import { MoodItem } from "@/components/ui/MoodSelector/MoodItem";
import { MoodSpecificItem } from "@/components/ui/MoodSelector/MoodSpecificItem";
import { useMoodSnapshot } from "@/hooks/useMoodSnapshot";
import { useTheme } from "@/hooks/useTheme";
import { formatRelativeDate } from "@/lib/formatRelativeDate";
import { getMoodAccentColor } from "@/lib/moodColors";
import { getMoodDisplayLabel, MOOD_CATEGORIES, MOOD_CATEGORY_SPECIFICS } from "@/lib/moodUtils";
import { spacing } from "@/styles";
import type { MoodCategory, MoodSpecific } from "@/types";

const FADE_DURATION = 180;
const STAGGER_DELAY = 30;
const SUCCESS_DISPLAY_MS = 2000;

type StripState = "idle" | "selecting" | "success";

export function MoodSnapshotStrip() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { logMood, isLogging, lastSnapshot } = useMoodSnapshot();

  const [state, setState] = useState<StripState>(lastSnapshot ? "success" : "idle");
  const [selectedCategory, setSelectedCategory] = useState<MoodCategory | null>(null);

  const handleCategorySelect = useCallback(
    (category: MoodCategory) => {
      if (isLogging) return;

      if (selectedCategory === category) {
        logMood(category);
        setState("success");
        setSelectedCategory(null);
        setTimeout(() => setState("idle"), SUCCESS_DISPLAY_MS);
        return;
      }

      setSelectedCategory(category);
      setState("selecting");
    },
    [selectedCategory, isLogging, logMood],
  );

  const handleSpecificSelect = useCallback(
    (specific: MoodSpecific) => {
      if (isLogging || !selectedCategory) return;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      logMood(selectedCategory, specific);
      setState("success");
      setSelectedCategory(null);
      setTimeout(() => setState("idle"), SUCCESS_DISPLAY_MS);
    },
    [selectedCategory, isLogging, logMood],
  );

  const handleSuccessTap = useCallback(() => {
    setState("selecting");
    setSelectedCategory(null);
  }, []);

  if (state === "success" || (state === "idle" && lastSnapshot)) {
    const displayCategory = lastSnapshot?.category ?? null;
    const displaySpecific = lastSnapshot?.specific ?? null;
    const displayLabel = getMoodDisplayLabel(displayCategory, displaySpecific) ?? t("home.moodSnapshot.logged");
    const accentColor = getMoodAccentColor(displayCategory);
    const timeLabel = lastSnapshot
      ? formatRelativeDate(lastSnapshot.timestamp.toISOString())
      : "";

    return (
      <Animated.View entering={FadeIn.duration(FADE_DURATION)} exiting={FadeOut.duration(FADE_DURATION)}>
        <Pressable onPress={handleSuccessTap} style={styles.successContainer}>
          <View style={styles.successContent}>
            <Icon icon={Check} size="sm" color={accentColor} />
            <AppText variant="body" color={accentColor}>
              {displayLabel}
            </AppText>
            <AppText variant="bodySmall" color={colors.textTertiary}>
              {timeLabel}
            </AppText>
          </View>
          <AppText variant="caption" color={colors.textTertiary}>
            {t("home.moodSnapshot.logAgain")}
          </AppText>
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      layout={LinearTransition.duration(FADE_DURATION)}
      style={styles.container}
    >
      <AppText variant="caption" color={colors.textSecondary}>
        {t("home.moodSnapshot.prompt")}
      </AppText>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryRow}
        keyboardShouldPersistTaps="handled"
      >
        {MOOD_CATEGORIES.map((cat) => (
          <MoodItem
            key={cat}
            category={cat}
            isSelected={selectedCategory === cat}
            onSelect={handleCategorySelect}
          />
        ))}
      </ScrollView>

      {selectedCategory ? (
        <View style={styles.specificRow}>
          {MOOD_CATEGORY_SPECIFICS[selectedCategory].map((spec, index) => (
            <Animated.View
              key={`${selectedCategory}-${spec}`}
              entering={FadeInDown.duration(FADE_DURATION).delay(index * STAGGER_DELAY)}
              exiting={FadeOutUp.duration(FADE_DURATION)}
            >
              <MoodSpecificItem
                category={selectedCategory}
                specific={spec}
                isSelected={false}
                onSelect={handleSpecificSelect}
              />
            </Animated.View>
          ))}
        </View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  categoryRow: {
    gap: spacing.sm,
  },
  specificRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  successContainer: {
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  successContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
});
