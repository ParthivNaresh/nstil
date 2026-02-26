import * as Haptics from "expo-haptics";
import { Check } from "lucide-react-native";
import { useCallback } from "react";
import { Pressable, ScrollView, View } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
} from "react-native-reanimated";
import { useTranslation } from "react-i18next";

import { AppText } from "@/components/ui/AppText";
import { useTabBarHeight } from "@/hooks/useTabBarHeight";
import { useTheme } from "@/hooks/useTheme";

import { JournalFilterRow } from "./JournalFilterRow";
import { CHECK_SIZE, styles } from "./styles";
import type { JournalFilterSheetProps } from "./types";

const BACKDROP_DURATION = 200;
const SHEET_DURATION = 250;

export function JournalFilterSheet({
  visible,
  journals,
  selectedId,
  onSelect,
  onClose,
}: JournalFilterSheetProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const isAllSelected = selectedId === null;

  const handleAllPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(null);
  }, [onSelect]);

  const handleJournalPress = useCallback(
    (id: string) => {
      onSelect(id);
    },
    [onSelect],
  );

  const tabBarHeight = useTabBarHeight();

  if (!visible) return null;

  return (
    <>
      <Animated.View
        entering={FadeIn.duration(BACKDROP_DURATION)}
        exiting={FadeOut.duration(BACKDROP_DURATION)}
        style={styles.backdrop}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />
      </Animated.View>
      <Animated.View
        entering={SlideInDown.duration(SHEET_DURATION)}
        exiting={SlideOutDown.duration(SHEET_DURATION)}
        style={[
          styles.sheet,
          {
            backgroundColor: colors.surfaceElevated,
            borderColor: colors.glassBorder,
            paddingBottom: tabBarHeight,
          },
        ]}
      >
        <View style={[styles.handle, { backgroundColor: colors.textTertiary }]} />
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <Pressable
            onPress={handleAllPress}
            style={[
              styles.row,
              { backgroundColor: isAllSelected ? colors.glass : "transparent" },
            ]}
            accessibilityRole="radio"
            accessibilityState={{ selected: isAllSelected }}
            accessibilityLabel={t("history.allJournals")}
          >
            <View style={[styles.colorDot, { backgroundColor: colors.accent }]} />
            <AppText
              variant="body"
              color={isAllSelected ? colors.textPrimary : colors.textSecondary}
              style={styles.rowLabel}
            >
              {t("history.allJournals")}
            </AppText>
            {isAllSelected ? (
              <Check size={CHECK_SIZE} color={colors.accent} strokeWidth={2.5} />
            ) : null}
          </Pressable>

          {journals.map((journal) => (
            <JournalFilterRow
              key={journal.id}
              journal={journal}
              isSelected={journal.id === selectedId}
              onPress={handleJournalPress}
            />
          ))}
        </ScrollView>
      </Animated.View>
    </>
  );
}
