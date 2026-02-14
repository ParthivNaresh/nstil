import { StatusBar } from "expo-status-bar";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AmbientBackground } from "@/components/ui/AmbientBackground";
import { useTheme } from "@/hooks/useTheme";

import type { ScreenContainerProps } from "./types";

export function ScreenContainer({
  children,
  scrollable = true,
  centered = false,
  ambient = true,
}: ScreenContainerProps) {
  const { colors, isDark } = useTheme();

  const content = centered ? (
    <View style={styles.centeredContent}>{children}</View>
  ) : (
    children
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {ambient ? <AmbientBackground /> : null}
      <StatusBar style={isDark ? "light" : "dark"} />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          {scrollable ? (
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {content}
            </ScrollView>
          ) : (
            content
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  centeredContent: {
    flex: 1,
    justifyContent: "center",
  },
});
