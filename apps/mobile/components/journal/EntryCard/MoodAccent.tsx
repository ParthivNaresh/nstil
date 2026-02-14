import {
  Canvas,
  LinearGradient,
  Rect,
  vec,
} from "@shopify/react-native-skia";
import { useCallback, useState } from "react";
import { StyleSheet, View, type LayoutChangeEvent } from "react-native";

import { getMoodGradient } from "@/lib/moodColors";

interface MoodAccentProps {
  readonly moodScore: number | null;
}

const STRIP_WIDTH = 4;

export function MoodAccent({ moodScore }: MoodAccentProps) {
  const [height, setHeight] = useState(0);
  const gradient = getMoodGradient(moodScore);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    setHeight(event.nativeEvent.layout.height);
  }, []);

  return (
    <View style={styles.container} onLayout={handleLayout}>
      {height > 0 ? (
        <Canvas style={styles.canvas}>
          <Rect x={0} y={0} width={STRIP_WIDTH} height={height}>
            <LinearGradient
              start={vec(0, 0)}
              end={vec(0, height)}
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
