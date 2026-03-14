import { WifiOff } from "lucide-react-native";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useTranslation } from "react-i18next";

import { EmptyState } from "@/components/ui/EmptyState";
import { useTheme } from "@/hooks/useTheme";
import { duration } from "@/styles";

import type { LoadingScreenProps } from "./types";

const FADE_IN_DURATION = duration.normal;

export function LoadingScreen({ variant, onRetry }: LoadingScreenProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, {
      duration: FADE_IN_DURATION,
      easing: Easing.out(Easing.cubic),
    });
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (variant === "error") {
    return (
      <Animated.View style={[styles.container, animatedStyle]}>
        <EmptyState
          icon={WifiOff}
          title={t("common.error.connectionTitle")}
          subtitle={t("common.error.connectionSubtitle")}
          actionLabel={onRetry ? t("common.tryAgain") : undefined}
          onAction={onRetry}
        />
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <ActivityIndicator size="small" color={colors.textTertiary} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
