import { useCallback } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import Animated, {
  FadeInDown,
  FadeOutUp,
  LinearTransition,
} from "react-native-reanimated";

import { AppText } from "@/components/ui/AppText";
import { useTheme } from "@/hooks/useTheme";
import { MOOD_CATEGORIES, MOOD_CATEGORY_SPECIFICS } from "@/lib/moodUtils";
import { spacing } from "@/styles";
import type { MoodCategory, MoodSpecific } from "@/types";

import { MoodItem } from "./MoodItem";
import { MoodSpecificItem } from "./MoodSpecificItem";
import type { MoodSelectorProps } from "./types";

const FADE_DURATION = 180;
const STAGGER_DELAY = 30;

export function MoodSelector({
  category,
  specific,
  onCategoryChange,
  onSpecificChange,
  label,
}: MoodSelectorProps) {
  const { colors } = useTheme();

  const handleCategorySelect = useCallback(
    (selected: MoodCategory) => {
      onCategoryChange(selected);
    },
    [onCategoryChange],
  );

  const handleSpecificSelect = useCallback(
    (selected: MoodSpecific) => {
      onSpecificChange(selected);
    },
    [onSpecificChange],
  );

  return (
    <Animated.View
      layout={LinearTransition.duration(FADE_DURATION)}
      style={styles.container}
      accessibilityRole="radiogroup"
    >
      {label ? (
        <AppText variant="caption" color={colors.textSecondary}>
          {label}
        </AppText>
      ) : null}

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
            isSelected={category === cat}
            onSelect={handleCategorySelect}
          />
        ))}
      </ScrollView>

      {category ? (
        <View style={styles.specificRow}>
          {MOOD_CATEGORY_SPECIFICS[category].map((spec, index) => (
            <Animated.View
              key={`${category}-${spec}`}
              entering={FadeInDown.duration(FADE_DURATION).delay(index * STAGGER_DELAY)}
              exiting={FadeOutUp.duration(FADE_DURATION)}
            >
              <MoodSpecificItem
                category={category}
                specific={spec}
                isSelected={specific === spec}
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
    width: "100%",
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
});
