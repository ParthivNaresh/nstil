import { Search, X } from "lucide-react-native";
import { useCallback, useEffect, useRef } from "react";
import {
  Pressable,
  StyleSheet,
  TextInput as RNTextInput,
  View,
} from "react-native";

import { Icon } from "@/components/ui/Icon";
import { colors, radius, spacing, typography } from "@/styles";

import type { SearchInputProps } from "./types";

const DEFAULT_DEBOUNCE_MS = 300;

export function SearchInput({
  value,
  onChangeText,
  onSearch,
  placeholder = "Search...",
  debounceMs = DEFAULT_DEBOUNCE_MS,
  accessibilityLabel,
  testID,
}: SearchInputProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!onSearch) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      onSearch(value);
    }, debounceMs);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [value, onSearch, debounceMs]);

  const handleClear = useCallback(() => {
    onChangeText("");
    onSearch?.("");
  }, [onChangeText, onSearch]);

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.iconLeft}>
        <Icon icon={Search} size="sm" color={colors.textTertiary} />
      </View>
      <RNTextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        selectionColor={colors.accent}
        keyboardAppearance="dark"
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
        accessibilityLabel={accessibilityLabel ?? placeholder}
      />
      {value.length > 0 ? (
        <Pressable
          onPress={handleClear}
          style={styles.clearButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
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
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: radius.md,
    height: 44,
  },
  iconLeft: {
    paddingLeft: spacing.md,
  },
  input: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
    paddingHorizontal: spacing.sm,
    height: "100%",
  },
  clearButton: {
    paddingRight: spacing.md,
    paddingLeft: spacing.sm,
    height: "100%",
    justifyContent: "center",
  },
});
