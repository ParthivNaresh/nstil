import { LinearGradient, Rect, vec } from "@shopify/react-native-skia";
import { useDerivedValue } from "react-native-reanimated";

import { getSkyColors } from "@/lib/drift";

import type { SkyGradientProps } from "./types";

export function SkyGradient({ dayProgress, width, height }: SkyGradientProps) {
  const colors = useDerivedValue(() => {
    const sky = getSkyColors(dayProgress.value);
    return [sky.top, sky.bottom];
  });

  return (
    <Rect x={0} y={0} width={width} height={height}>
      <LinearGradient start={vec(0, 0)} end={vec(0, height)} colors={colors} />
    </Rect>
  );
}
