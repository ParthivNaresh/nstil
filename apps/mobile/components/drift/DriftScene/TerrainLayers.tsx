import { Group, Path, Skia } from "@shopify/react-native-skia";
import { useMemo } from "react";
import { useDerivedValue } from "react-native-reanimated";

import { DRIFT_CONFIG, generateTerrainPath, getTerrainTint } from "@/lib/drift";
import type { TerrainLayerConfig } from "@/lib/drift";

import type { TerrainLayersProps } from "./types";

const { terrainLoopWidth, terrainPointCount, layers } = DRIFT_CONFIG;

interface TerrainPathData {
  readonly svgPath: string;
  readonly skPath: ReturnType<typeof Skia.Path.MakeFromSVGString>;
  readonly layer: TerrainLayerConfig;
  readonly layerIndex: number;
}

function buildTerrainPaths(
  width: number,
  height: number,
): readonly TerrainPathData[] {
  const result: TerrainPathData[] = [];

  for (let i = 0; i < layers.length; i++) {
    const layer = layers[i];
    const svg = generateTerrainPath(width, height, layer, terrainLoopWidth, terrainPointCount);
    const skPath = Skia.Path.MakeFromSVGString(svg);
    result.push({ svgPath: svg, skPath, layer, layerIndex: i });
  }

  return result;
}

function TerrainCopy({
  pathData,
  dayProgress,
  scrollX,
  copyIndex,
}: {
  readonly pathData: TerrainPathData;
  readonly dayProgress: TerrainLayersProps["dayProgress"];
  readonly scrollX: TerrainLayersProps["scrollX"];
  readonly copyIndex: number;
}) {
  const { layer, layerIndex } = pathData;
  const parallax = layer.parallaxFactor;
  const offset = copyIndex * terrainLoopWidth;

  const transform = useDerivedValue(() => {
    const tx = -(scrollX.value * parallax) + offset;
    return [{ translateX: tx }];
  });

  const depth = layer.depthFactor;
  const color = useDerivedValue(() => getTerrainTint(dayProgress.value, depth));

  if (!pathData.skPath) return null;

  return (
    <Path
      key={`${layerIndex}-${copyIndex}`}
      path={pathData.skPath}
      color={color}
      transform={transform}
    />
  );
}

export function TerrainLayers({ dayProgress, scrollX, width, height }: TerrainLayersProps) {
  const terrainPaths = useMemo(
    () => buildTerrainPaths(width, height),
    [width, height],
  );

  return (
    <Group>
      {terrainPaths.map((pathData) => (
        <Group key={pathData.layerIndex}>
          <TerrainCopy
            pathData={pathData}
            dayProgress={dayProgress}
            scrollX={scrollX}
            copyIndex={0}
          />
          <TerrainCopy
            pathData={pathData}
            dayProgress={dayProgress}
            scrollX={scrollX}
            copyIndex={1}
          />
        </Group>
      ))}
    </Group>
  );
}
