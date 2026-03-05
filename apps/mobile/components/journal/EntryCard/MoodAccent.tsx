import {
  Canvas,
  LinearGradient,
  Rect,
  vec,
} from "@shopify/react-native-skia";
import { StyleSheet, View } from "react-native";

import { useCanvasSize } from "@/lib/animation";
import { getMoodGradient } from "@/lib/moodColors";
import type { MoodCategory } from "@/types";

interface MoodAccentProps {
  readonly moodCategory: MoodCategory | null;
}

const STRIP_WIDTH = 4;

export function MoodAccent({ moodCategory }: MoodAccentProps) {
  const { size, onLayout, hasSize } = useCanvasSize();
  const gradient = getMoodGradient(moodCategory);

  return (
    <View style={styles.container} onLayout={onLayout}>
      {hasSize ? (
        <Canvas style={styles.canvas}>
          <Rect x={0} y={0} width={STRIP_WIDTH} height={size.height}>
            <LinearGradient
              start={vec(0, 0)}
              end={vec(0, size.height)}
              colors={[gradient.from, gradient.to]}
            />
          </Rect>
        </Canvas>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: STRIP_WIDTH,
  },
  canvas: {
    flex: 1,
  },
});
