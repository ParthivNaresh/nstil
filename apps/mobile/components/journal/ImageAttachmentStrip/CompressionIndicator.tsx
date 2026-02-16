import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { AppText } from "@/components/ui/AppText";
import type { CompressionProgress } from "@/hooks/useImagePicker";
import { useTheme } from "@/hooks/useTheme";
import { radius, spacing } from "@/styles";

const BAR_HEIGHT = 4;

interface CompressionIndicatorProps {
  readonly progress: CompressionProgress;
}

export function CompressionIndicator({ progress }: CompressionIndicatorProps) {
  const { colors } = useTheme();
  const fraction = progress.total > 0 ? progress.completed / progress.total : 0;
  const widthPercent = useSharedValue(0);

  useEffect(() => {
    widthPercent.value = withTiming(fraction * 100, { duration: 200 });
  }, [fraction, widthPercent]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${widthPercent.value}%`,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <AppText variant="caption" color={colors.textTertiary}>
          Processing {progress.completed}/{progress.total}
        </AppText>
      </View>
      <View style={[styles.track, { backgroundColor: colors.border }]}>
        <Animated.View
          style={[styles.fill, { backgroundColor: colors.accent }, barStyle]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  track: {
    height: BAR_HEIGHT,
    borderRadius: radius.full,
    overflow: "hidden",
  },
  fill: {
    height: BAR_HEIGHT,
    borderRadius: radius.full,
  },
});
