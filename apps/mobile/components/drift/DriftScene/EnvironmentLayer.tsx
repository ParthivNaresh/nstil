import { Rect, Shader } from "@shopify/react-native-skia";
import { useDerivedValue } from "react-native-reanimated";

import { driftSceneShader } from "@/lib/drift/driftSceneShader";

import type { EnvironmentLayerProps } from "./types";

export function EnvironmentLayer({
  time,
  dayProgress,
  scrollX,
  width,
  height,
}: EnvironmentLayerProps) {
  const uniforms = useDerivedValue(() => ({
    uResolution: [width, height] as const,
    uTime: time.value,
    uPhase: dayProgress.value,
    uScrollX: scrollX.value / (width > 0 ? width : 1),
  }));

  if (!driftSceneShader) return null;

  return (
    <Rect x={0} y={0} width={width} height={height}>
      <Shader source={driftSceneShader} uniforms={uniforms} />
    </Rect>
  );
}
