import "@/lib/i18n";

import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { setupDeepLinkListener } from "@/lib/deepLink";
import { queryClient } from "@/lib/queryClient";
import { useAuthStore } from "@/stores/authStore";
import { useThemeStore } from "@/stores/themeStore";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const initializeAuth = useAuthStore((s) => s.initialize);
  const authInitialized = useAuthStore((s) => s.initialized);
  const initializeTheme = useThemeStore((s) => s.initialize);
  const themeInitialized = useThemeStore((s) => s.initialized);

  useEffect(() => {
    initializeTheme();
  }, [initializeTheme]);

  useEffect(() => {
    const boot = async () => {
      try {
        await initializeAuth();
      } catch {
        // proceed with null session
      } finally {
        await SplashScreen.hideAsync();
      }
    };
    boot();
  }, [initializeAuth]);

  useEffect(() => {
    const cleanup = setupDeepLinkListener();
    return cleanup;
  }, []);

  if (!authInitialized || !themeInitialized) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <Stack screenOptions={{ headerShown: false }} />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
