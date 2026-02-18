import "@/lib/i18n";

import { QueryClientProvider } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useCallback, useEffect, useRef } from "react";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AmbientBackground } from "@/components/ui/AmbientBackground";
import { useNotificationSync } from "@/hooks/useNotificationSync";
import { setupDeepLinkListener } from "@/lib/deepLink";
import {
  addResponseListener,
  configureNotificationHandler,
  getLastResponseAsync,
} from "@/lib/notifications";
import { queryClient } from "@/lib/queryClient";
import { useAuthStore } from "@/stores/authStore";
import { useNotificationStore } from "@/stores/notificationStore";
import { useThemeStore } from "@/stores/themeStore";
import type { ColorPalette } from "@/styles/palettes";

configureNotificationHandler();

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const router = useRouter();
  const initializeAuth = useAuthStore((s) => s.initialize);
  const authInitialized = useAuthStore((s) => s.initialized);
  const initializeTheme = useThemeStore((s) => s.initialize);
  const themeInitialized = useThemeStore((s) => s.initialized);
  const initializeNotifications = useNotificationStore((s) => s.initialize);
  const colors: ColorPalette = useThemeStore((s) => s.colors);
  const navigationReady = useRef(false);

  useNotificationSync();

  const handleNotificationTap = useCallback(() => {
    if (navigationReady.current) {
      router.push("/check-in?source=notification");
    }
  }, [router]);

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
    initializeNotifications();
  }, [initializeNotifications]);

  useEffect(() => {
    const subscription = addResponseListener(handleNotificationTap);

    getLastResponseAsync().then((response) => {
      if (response) {
        handleNotificationTap();
      }
    });

    return () => subscription.remove();
  }, [handleNotificationTap]);

  useEffect(() => {
    if (authInitialized && themeInitialized) {
      navigationReady.current = true;
    }
  }, [authInitialized, themeInitialized]);

  useEffect(() => {
    const cleanup = setupDeepLinkListener();
    return cleanup;
  }, []);

  if (!authInitialized || !themeInitialized) {
    return null;
  }

  return (
    <GestureHandlerRootView style={[styles.root, { backgroundColor: colors.background }]}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AmbientBackground />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: styles.transparent,
            }}
          />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  transparent: {
    backgroundColor: "transparent",
  },
});
