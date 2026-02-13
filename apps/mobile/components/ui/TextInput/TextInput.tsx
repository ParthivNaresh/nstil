import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  StyleSheet,
  TextInput as RNTextInput,
  View,
} from "react-native";
import {
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { colors, duration, radius, spacing, typography } from "@/styles";

import { ErrorMessage } from "./ErrorMessage";
import { FloatingLabel } from "./FloatingLabel";
import { SecureToggle } from "./SecureToggle";
import type { TextInputProps } from "./types";

const ANIMATION_DURATION = duration.fast;

export function TextInput({
  label,
  value,
  onChangeText,
  error,
  secureTextEntry = false,
  keyboardType = "default",
  autoCapitalize = "none",
  autoComplete = "off",
  returnKeyType = "done",
  onSubmitEditing,
  inputRef,
  accessibilityLabel,
  testID,
}: TextInputProps) {
  const { t } = useTranslation();
  const [isFocused, setIsFocused] = useState(false);
  const [isSecureVisible, setIsSecureVisible] = useState(false);
  const labelProgress = useSharedValue(value ? 1 : 0);

  const hasError = Boolean(error);
  const isActive = isFocused || Boolean(value);

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

  const toggleSecureVisibility = useCallback(() => {
    setIsSecureVisible((prev) => !prev);
  }, []);

  const borderColor = hasError
    ? colors.error
    : isFocused
      ? colors.borderFocused
      : colors.glassBorder;

  return (
    <View style={styles.container}>
      <View style={[styles.inputContainer, { borderColor }]}>
        <FloatingLabel label={label} progress={labelProgress} hasError={hasError} />
        <RNTextInput
          ref={inputRef}
          style={[styles.input, secureTextEntry && styles.inputWithToggle]}
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={secureTextEntry && !isSecureVisible}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          placeholderTextColor="transparent"
          selectionColor={colors.accent}
          keyboardAppearance="dark"
          accessibilityLabel={accessibilityLabel ?? label}
          accessibilityState={{ selected: isActive }}
          testID={testID}
        />
        {secureTextEntry && (
          <SecureToggle
            isSecure={!isSecureVisible}
            onToggle={toggleSecureVisibility}
            showLabel={t("common.accessibility.showPassword")}
            hideLabel={t("common.accessibility.hidePassword")}
          />
        )}
      </View>
      {hasError && error && <ErrorMessage message={error} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  inputContainer: {
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderRadius: radius.md,
    height: 56,
    justifyContent: "center",
  },
  input: {
    ...typography.body,
    color: colors.textPrimary,
    paddingHorizontal: spacing.md,
    paddingTop: 22,
    paddingBottom: 8,
    height: "100%",
  },
  inputWithToggle: {
    paddingRight: 56,
  },
});
