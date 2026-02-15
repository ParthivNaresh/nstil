import {
  Canvas,
  LinearGradient,
  Rect,
  RoundedRect,
  vec,
} from "@shopify/react-native-skia";
import { useCallback, useState } from "react";
import { StyleSheet, View, type LayoutChangeEvent } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { withAlpha } from "@/lib/colorUtils";
import { getMoodGradient } from "@/lib/moodColors";
import { getMoodDisplayLabel, getMoodLabel } from "@/lib/moodUtils";
import { spacing } from "@/styles";
import type { MoodCategory, MoodSpecific } from "@/types";

interface MoodBannerProps {
  readonly moodCategory: MoodCategory;
  readonly moodSpecific: MoodSpecific | null;
}

const GRADIENT_OPACITY = 0.2;
const BANNER_HEIGHT = 72;
const ORB_SIZE = 32;

export function MoodBanner({ moodCategory, moodSpecific }: MoodBannerProps) {
  const [width, setWidth] = useState(0);
  const gradient = getMoodGradient(moodCategory);
  const categoryLabel = getMoodLabel(moodCategory);
  const displayLabel = getMoodDisplayLabel(moodCategory, moodSpecific);

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
                withAlpha(gradient.to, GRADIENT_OPACITY * 0.3),
              ]}
            />
          </Rect>
        </Canvas>
      ) : null}
      <View style={styles.content}>
        <View style={styles.orbContainer}>
          <Canvas style={styles.orbCanvas}>
            <RoundedRect
              x={0}
              y={0}
              width={ORB_SIZE}
              height={ORB_SIZE}
              r={ORB_SIZE / 2}
            >
              <LinearGradient
                start={vec(0, 0)}
                end={vec(ORB_SIZE, ORB_SIZE)}
                colors={[gradient.from, gradient.to]}
              />
            </RoundedRect>
          </Canvas>
        </View>
        <View style={styles.labels}>
          {displayLabel ? (
            <AppText variant="label" color={gradient.from}>
              {displayLabel}
            </AppText>
          ) : null}
          {moodSpecific && categoryLabel ? (
            <AppText variant="caption" color={withAlpha(gradient.from, 0.6)}>
              {categoryLabel}
            </AppText>
          ) : null}
        </View>
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
  orbContainer: {
    width: ORB_SIZE,
    height: ORB_SIZE,
  },
  orbCanvas: {
    width: ORB_SIZE,
    height: ORB_SIZE,
  },
  labels: {
    gap: 2,
  },
});
