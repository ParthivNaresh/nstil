import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
} from "react-native";

import { useTheme } from "@/hooks/useTheme";

import type { ScrollContainerProps } from "./types";

export function ScrollContainer({
  children,
  onRefresh,
  refreshing = false,
  contentContainerStyle,
  keyboardAware = true,
}: ScrollContainerProps) {
  const { colors } = useTheme();

  const refreshControl = onRefresh ? (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={colors.accent}
      progressBackgroundColor={colors.surface}
    />
  ) : undefined;

  const scrollView = (
    <ScrollView
      contentContainerStyle={[styles.content, contentContainerStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      refreshControl={refreshControl}
    >
      {children}
    </ScrollView>
  );

  if (!keyboardAware) {
    return scrollView;
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      {scrollView}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },
});
