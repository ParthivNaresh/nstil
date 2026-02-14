import { Search, X } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  TextInput as RNTextInput,
  View,
} from "react-native";

import { Icon } from "@/components/ui/Icon";
import { useTheme } from "@/hooks/useTheme";
import { radius, spacing, typography } from "@/styles";

import type { SearchInputProps } from "./types";

const DEFAULT_DEBOUNCE_MS = 300;

export function SearchInput({
  value,
  onChangeText,
  onSearch,
  placeholder = "Search...",
  debounceMs = DEFAULT_DEBOUNCE_MS,
  testID,
}: SearchInputProps) {
  const { colors, keyboardAppearance } = useTheme();
  const [localValue, setLocalValue] = useState(value ?? "");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (value !== undefined) {
      setLocalValue(value);
    }
  }, [value]);

  const handleChangeText = useCallback(
    (text: string) => {
      setLocalValue(text);
      onChangeText?.(text);

      if (onSearch) {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => onSearch(text), debounceMs);
      }
    },
    [onChangeText, onSearch, debounceMs],
  );

  const handleClear = useCallback(() => {
    handleChangeText("");
  }, [handleChangeText]);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.glass, borderColor: colors.glassBorder },
      ]}
      testID={testID}
    >
      <View style={styles.iconLeft}>
        <Icon icon={Search} size="sm" color={colors.textTertiary} />
      </View>
      <RNTextInput
        style={[styles.input, { color: colors.textPrimary }]}
        value={localValue}
        onChangeText={handleChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        selectionColor={colors.accent}
        keyboardAppearance={keyboardAppearance}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
      />
      {localValue.length > 0 ? (
        <Pressable
          onPress={handleClear}
          style={styles.clearButton}
          hitSlop={8}
          accessibilityLabel="Clear search"
        >
          <Icon icon={X} size="xs" color={colors.textTertiary} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: radius.md,
    height: 44,
  },
  iconLeft: {
    paddingLeft: spacing.sm,
  },
  input: {
    ...typography.body,
    flex: 1,
    paddingHorizontal: spacing.sm,
    height: "100%",
  },
  clearButton: {
    paddingHorizontal: spacing.sm,
    height: "100%",
    justifyContent: "center",
  },
});
