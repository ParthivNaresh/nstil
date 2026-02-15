import { useCallback, useMemo, useState } from "react";
import {
  StyleSheet,
  TextInput as RNTextInput,
  View,
} from "react-native";
import {
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { AppText } from "@/components/ui/AppText";
import { FloatingLabel } from "@/components/ui/TextInput/FloatingLabel";
import { ErrorMessage } from "@/components/ui/TextInput/ErrorMessage";
import { useTheme } from "@/hooks/useTheme";
import { duration, radius, spacing, typography } from "@/styles";

import type { TextAreaProps } from "./types";

const DEFAULT_MIN_HEIGHT = 120;
const DEFAULT_MAX_HEIGHT = 300;
const ANIMATION_DURATION = duration.fast;

export function TextArea({
  label,
  value,
  onChangeText,
  error,
  variant = "outlined",
  maxLength,
  showCount = false,
  minHeight = DEFAULT_MIN_HEIGHT,
  maxHeight = DEFAULT_MAX_HEIGHT,
  placeholder,
  accessibilityLabel,
  testID,
}: TextAreaProps) {
  const { colors, keyboardAppearance } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [contentHeight, setContentHeight] = useState(minHeight);
  const labelProgress = useSharedValue(value ? 1 : 0);
  const isFlat = variant === "flat";

  const hasError = Boolean(error);
  const isActive = isFocused || Boolean(value);
  const charCount = value.length;
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    labelProgress.value = withTiming(1, { duration: ANIMATION_DURATION });
  }, [labelProgress]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    if (!value) {
      labelProgress.value = withTiming(0, { duration: ANIMATION_DURATION });
    }
  }, [labelProgress, value]);

  const handleContentSizeChange = useCallback(
    (event: { nativeEvent: { contentSize: { height: number } } }) => {
      const newHeight = Math.min(
        Math.max(event.nativeEvent.contentSize.height, minHeight),
        maxHeight,
      );
      setContentHeight(newHeight);
    },
    [minHeight, maxHeight],
  );

  const borderColor = hasError
    ? colors.error
    : isFocused
      ? colors.borderFocused
      : colors.glassBorder;

  const inputContainerStyle = useMemo(
    () =>
      isFlat
        ? [styles.flatContainer, { borderBottomColor: borderColor, minHeight }]
        : [styles.inputContainer, { borderColor, backgroundColor: colors.glass, minHeight }],
    [isFlat, borderColor, colors.glass, minHeight],
  );

  const inputStyle = useMemo(
    () => [
      isFlat ? styles.flatInput : styles.input,
      { height: contentHeight, color: colors.textPrimary },
    ],
    [isFlat, contentHeight, colors.textPrimary],
  );

  return (
    <View style={styles.container}>
      <View style={inputContainerStyle}>
        <FloatingLabel label={label} progress={labelProgress} hasError={hasError} />
        <RNTextInput
          style={inputStyle}
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onContentSizeChange={handleContentSizeChange}
          multiline
          textAlignVertical="top"
          maxLength={maxLength}
          placeholder={isActive ? placeholder : undefined}
          placeholderTextColor={colors.textTertiary}
          selectionColor={colors.accent}
          keyboardAppearance={keyboardAppearance}
          accessibilityLabel={accessibilityLabel ?? label}
          accessibilityState={{ selected: isActive }}
          testID={testID}
        />
      </View>

      <View style={styles.footer}>
        <View style={styles.errorContainer}>
          {hasError && error ? <ErrorMessage message={error} /> : null}
        </View>
        {showCount ? (
          <AppText variant="caption" color={colors.textTertiary}>
            {maxLength
              ? `${charCount}/${maxLength}`
              : `${wordCount} ${wordCount === 1 ? "word" : "words"}`}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  inputContainer: {
    borderWidth: 1,
    borderRadius: radius.md,
  },
  flatContainer: {
    borderBottomWidth: 1,
  },
  input: {
    ...typography.body,
    paddingHorizontal: spacing.md,
    paddingTop: 28,
    paddingBottom: spacing.sm,
  },
  flatInput: {
    ...typography.body,
    paddingHorizontal: 0,
    paddingTop: 24,
    paddingBottom: spacing.sm,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: spacing.xs,
  },
  errorContainer: {
    flex: 1,
  },
});
