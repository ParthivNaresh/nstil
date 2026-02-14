import { Canvas, LinearGradient, Rect, vec } from "@shopify/react-native-skia";
import { useCallback, useState } from "react";
import { StyleSheet, View, type LayoutChangeEvent } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { withAlpha } from "@/lib/colorUtils";
import { getMoodGradient } from "@/lib/moodColors";
import { getMoodEmoji, getMoodLabel } from "@/lib/moodUtils";
import { spacing } from "@/styles";

interface MoodBannerProps {
  readonly moodScore: number;
}

const GRADIENT_OPACITY = 0.2;
const BANNER_HEIGHT = 80;

export function MoodBanner({ moodScore }: MoodBannerProps) {
  const [width, setWidth] = useState(0);
  const gradient = getMoodGradient(moodScore);
  const emoji = getMoodEmoji(moodScore);
  const label = getMoodLabel(moodScore);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
  }, []);

  return (
    <View style={styles.container} onLayout={handleLayout}>
      {width > 0 ? (
        <Canvas style={StyleSheet.absoluteFill}>
          <Rect x={0} y={0} width={width} height={BANNER_HEIGHT}>
            <LinearGradient
              start={vec(0, 0)}
              end={vec(width, 0)}
              colors={[
                withAlpha(gradient.from, GRADIENT_OPACITY),
                withAlpha(gradient.to, GRADIENT_OPACITY * 0.4),
              ]}
            />
          </Rect>
        </Canvas>
      ) : null}
      <View style={styles.content}>
        {emoji ? <AppText variant="h1">{emoji}</AppText> : null}
        {label ? (
          <AppText variant="label" color={gradient.from}>
            {label}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: BANNER_HEIGHT,
    marginHorizontal: -spacing.md,
    overflow: "hidden",
  },
  content: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
});
