import "@/lib/i18n";

import { QueryClientProvider } from "@tanstack/react-query";
import { useRouter, useSegments } from "expo-router";
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
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'https://0126de7e96ed4465ae587322a5264f2b@o4511003870035968.ingest.us.sentry.io/4511003872657408',

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Enable Logs
  enableLogs: true,

  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration(), Sentry.feedbackIntegration()],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

configureNotificationHandler();

SplashScreen.preventAutoHideAsync().catch(() => {});

export default Sentry.wrap(function RootLayout() {
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

  const session = useAuthStore((s) => s.session);
  const isEmailVerified = useAuthStore((s) => s.isEmailVerified);
  const segments = useSegments();
  const isReady = authInitialized && themeInitialized;

  useEffect(() => {
    if (authInitialized && themeInitialized) {
      navigationReady.current = true;
    }
  }, [authInitialized, themeInitialized]);

  useEffect(() => {
    if (!isReady) return;

    const inAuthGroup = segments[0] === "(auth)";
    const isAuthenticated = !!session && isEmailVerified;

    if (isAuthenticated && inAuthGroup) {
      router.replace("/(tabs)");
    } else if (!isAuthenticated && !inAuthGroup && segments.length > 0) {
      router.replace("/(auth)");
    }
  }, [session, isEmailVerified, segments, isReady, router]);

  useEffect(() => {
    const cleanup = setupDeepLinkListener();
    return cleanup;
  }, []);

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
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  transparent: {
    backgroundColor: "transparent",
  },
});
