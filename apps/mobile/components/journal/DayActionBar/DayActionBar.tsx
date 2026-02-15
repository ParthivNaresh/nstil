import * as Haptics from "expo-haptics";
import { Search, X } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  TextInput as RNTextInput,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
} from "react-native-reanimated";

import { AppText } from "@/components/ui/AppText";
import { Icon } from "@/components/ui/Icon";
import { useTheme } from "@/hooks/useTheme";
import { radius, spacing, typography } from "@/styles";

interface DayActionBarProps {
  readonly selectedDate: string;
  readonly searchValue: string;
  readonly onSearchChange: (text: string) => void;
  readonly onAddReflection: () => void;
  readonly showSearch: boolean;
  readonly searchPlaceholder?: string;
}

export function DayActionBar({
  selectedDate,
  searchValue,
  onSearchChange,
  onAddReflection,
  showSearch,
  searchPlaceholder = "Search...",
}: DayActionBarProps) {
  const { colors, keyboardAppearance } = useTheme();
  const [isSearchActive, setIsSearchActive] = useState(false);
  const inputRef = useRef<RNTextInput>(null);

  useEffect(() => {
    setIsSearchActive(false);
    onSearchChange("");
  }, [selectedDate, onSearchChange]);

  useEffect(() => {
    if (!isSearchActive && searchValue.length > 0) {
      onSearchChange("");
    }
  }, [isSearchActive, searchValue, onSearchChange]);

  const handleSearchOpen = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsSearchActive(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const handleSearchClose = useCallback(() => {
    setIsSearchActive(false);
    inputRef.current?.blur();
  }, []);

  const handleClear = useCallback(() => {
    onSearchChange("");
    inputRef.current?.focus();
  }, [onSearchChange]);

  if (isSearchActive && showSearch) {
    return (
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(150)}
        layout={LinearTransition.duration(200)}
        style={localStyles.container}
      >
        <View
          style={[
            localStyles.searchBar,
            { backgroundColor: colors.glass, borderColor: colors.glassBorder },
          ]}
        >
          <View style={localStyles.searchIconLeft}>
            <Icon icon={Search} size="sm" color={colors.textTertiary} />
          </View>
          <RNTextInput
            ref={inputRef}
            style={[localStyles.searchInput, { color: colors.textPrimary }]}
            value={searchValue}
            onChangeText={onSearchChange}
            placeholder={searchPlaceholder}
            placeholderTextColor={colors.textTertiary}
            selectionColor={colors.accent}
            keyboardAppearance={keyboardAppearance}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Pressable
            onPress={searchValue.length > 0 ? handleClear : handleSearchClose}
            style={localStyles.closeButton}
            hitSlop={8}
          >
            <Icon icon={X} size="xs" color={colors.textTertiary} />
          </Pressable>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(150)}
      layout={LinearTransition.duration(200)}
      style={localStyles.container}
    >
      <Pressable
        onPress={onAddReflection}
        style={[localStyles.addButton, { borderColor: colors.glassBorder }]}
      >
        <AppText variant="body" color={colors.textTertiary}>
          Add a reflection
        </AppText>
      </Pressable>
      {showSearch ? (
        <Pressable
          onPress={handleSearchOpen}
          style={[localStyles.searchToggle, { borderColor: colors.glassBorder }]}
          accessibilityLabel="Search entries"
        >
          <Icon icon={Search} size="sm" color={colors.textTertiary} />
        </Pressable>
      ) : null}
    </Animated.View>
  );
}

const localStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  addButton: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  searchToggle: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: radius.md,
    height: 44,
  },
  searchIconLeft: {
    paddingLeft: spacing.sm,
  },
  searchInput: {
    ...typography.body,
    flex: 1,
    paddingHorizontal: spacing.sm,
    height: "100%",
  },
  closeButton: {
    paddingHorizontal: spacing.sm,
    height: "100%",
    justifyContent: "center",
  },
});
