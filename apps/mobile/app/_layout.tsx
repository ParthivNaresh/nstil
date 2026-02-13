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

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const initialize = useAuthStore((s) => s.initialize);
  const initialized = useAuthStore((s) => s.initialized);

  useEffect(() => {
    const boot = async () => {
      try {
        await initialize();
      } catch {
        // proceed with null session
      } finally {
        await SplashScreen.hideAsync();
      }
    };
    boot();
  }, [initialize]);

  useEffect(() => {
    const cleanup = setupDeepLinkListener();
    return cleanup;
  }, []);

  if (!initialized) {
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
