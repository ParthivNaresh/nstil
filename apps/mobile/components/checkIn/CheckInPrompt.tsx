import { useCallback } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import { useTranslation } from "react-i18next";

import { AppText, Button } from "@/components/ui";
import { useHeaderHeight, useTheme } from "@/hooks";
import { getMoodGradient } from "@/lib/moodColors";
import { radius, spacing, typography } from "@/styles";
import type { MoodCategory } from "@/types";

interface CheckInPromptProps {
  readonly promptContent: string | null;
  readonly moodCategory: MoodCategory | null;
  readonly responseText: string;
  readonly isSubmitting: boolean;
  readonly onResponseChange: (text: string) => void;
  readonly onSubmit: () => void;
  readonly onSkip: () => void;
}

const FADE_DURATION = 400;
const PROMPT_DELAY = 150;
const INPUT_MIN_HEIGHT = 160;

export function CheckInPrompt({
  promptContent,
  moodCategory,
  responseText,
  isSubmitting,
  onResponseChange,
  onSubmit,
  onSkip,
}: CheckInPromptProps) {
  const { t } = useTranslation();
  const { colors, keyboardAppearance } = useTheme();
  const headerHeight = useHeaderHeight();
  const gradient = getMoodGradient(moodCategory);

  const handleSubmit = useCallback(() => {
    onSubmit();
  }, [onSubmit]);

  const handleSkip = useCallback(() => {
    onSkip();
  }, [onSkip]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={headerHeight}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <Animated.View
          entering={FadeIn.duration(FADE_DURATION)}
          style={styles.inner}
        >
          <Animated.View
            entering={FadeInUp.duration(FADE_DURATION).delay(PROMPT_DELAY)}
            style={styles.promptSection}
          >
            <AppText
              variant="h2"
              color={gradient.from}
              style={styles.promptText}
            >
              {promptContent ?? t("checkIn.defaultPrompt")}
            </AppText>
          </Animated.View>

          <View style={styles.inputSection}>
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.textPrimary,
                  borderColor: colors.glassBorder,
                },
              ]}
              value={responseText}
              onChangeText={onResponseChange}
              placeholder={t("checkIn.responsePlaceholder")}
              placeholderTextColor={colors.textTertiary}
              multiline
              textAlignVertical="top"
              maxLength={50000}
              selectionColor={colors.accent}
              keyboardAppearance={keyboardAppearance}
            />
          </View>

          <View style={styles.footer}>
            <Button
              title={t("checkIn.done")}
              onPress={handleSubmit}
              loading={isSubmitting}
            />
            <Pressable
              onPress={handleSkip}
              disabled={isSubmitting}
              style={styles.skipButton}
            >
              <AppText variant="label" color={colors.textTertiary}>
                {t("checkIn.skip")}
              </AppText>
            </Pressable>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  inner: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  promptSection: {
    alignItems: "center",
    paddingVertical: spacing.xl,
  },
  promptText: {
    textAlign: "center",
    lineHeight: 32,
  },
  inputSection: {
    minHeight: INPUT_MIN_HEIGHT,
    flex: 1,
    paddingVertical: spacing.md,
  },
  input: {
    ...typography.body,
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  footer: {
    gap: spacing.md,
    alignItems: "center",
  },
  skipButton: {
    paddingVertical: spacing.sm,
  },
});
