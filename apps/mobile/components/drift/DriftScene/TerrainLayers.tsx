import { Group, LinearGradient, Path, Skia, vec } from "@shopify/react-native-skia";
import { useMemo } from "react";
import { useDerivedValue } from "react-native-reanimated";

import {
  DRIFT_CONFIG,
  FAR_RIDGE,
  MID_FAR_RIDGE,
  MID_NEAR_RIDGE,
  MID_RIDGE,
  NEAR_RIDGE,
  getDirectionalGradient,
  getGradientEndpoints,
  getLightDirection,
} from "@/lib/drift";
import type { AuthoredRidgeData, TerrainLayerConfig } from "@/lib/drift";

import type { TerrainLayersProps } from "./types";

const { layers } = DRIFT_CONFIG;

const AUTHORED_RIDGES: ReadonlyMap<number, AuthoredRidgeData> = new Map([
  [0, FAR_RIDGE],
  [1, MID_FAR_RIDGE],
  [2, MID_RIDGE],
  [3, MID_NEAR_RIDGE],
  [4, NEAR_RIDGE],
]);

const GRADIENT_POSITIONS = [0, 0.35, 1];

interface TerrainPathData {
  readonly skPath: ReturnType<typeof Skia.Path.MakeFromSVGString>;
  readonly layer: TerrainLayerConfig;
  readonly layerIndex: number;
  readonly ridgelineY: number;
}

function buildAuthoredPath(
  ridge: AuthoredRidgeData,
  layer: TerrainLayerConfig,
  canvasHeight: number,
): ReturnType<typeof Skia.Path.MakeFromSVGString> {
  const skPath = Skia.Path.MakeFromSVGString(ridge.path);
  if (!skPath) return null;

  const scaleX = layer.loopWidth / ridge.svgWidth;
  const scaleY = (canvasHeight / ridge.svgHeight) * ridge.verticalScale;
  const shiftY = ridge.verticalShift * (canvasHeight / ridge.svgHeight);

  const matrix = Skia.Matrix();
  matrix.translate(0, shiftY);
  matrix.scale(scaleX, scaleY);
  skPath.transform(matrix);

  return skPath;
}

function buildTerrainPaths(height: number): readonly TerrainPathData[] {
  const result: TerrainPathData[] = [];

  for (let i = 0; i < layers.length; i++) {
    const layer = layers[i];
    const ridge = AUTHORED_RIDGES.get(i);
    if (!ridge) continue;

    const skPath = buildAuthoredPath(ridge, layer, height);
    const scaleY = height / ridge.svgHeight;
    const ridgelineY = (ridge.ridgeMinY + ridge.verticalShift) * scaleY;

    result.push({ skPath, layer, layerIndex: i, ridgelineY });
  }

  return result;
}

function TerrainCopy({
  pathData,
  dayProgress,
  scrollX,
  copyIndex,
  width,
  height,
}: {
  readonly pathData: TerrainPathData;
  readonly dayProgress: TerrainLayersProps["dayProgress"];
  readonly scrollX: TerrainLayersProps["scrollX"];
  readonly copyIndex: number;
  readonly width: number;
  readonly height: number;
}) {
  const { layer, layerIndex, ridgelineY } = pathData;
  const parallax = layer.parallaxFactor;
  const layerLoop = layer.loopWidth;
  const offset = copyIndex * layerLoop;

  const scrollTx = useDerivedValue(() => {
    const layerScroll = scrollX.value * parallax;
    const mod = layerScroll % layerLoop;
    return -(mod < 0 ? mod + layerLoop : mod) + offset;
  });

  const pathTransform = useDerivedValue(() => [{ translateX: scrollTx.value }]);

  const shaderTransform = useDerivedValue(() => [{ translateX: -scrollTx.value }]);

  const depth = layer.depthFactor;
  const gradientColors = useDerivedValue(() => {
    const g = getDirectionalGradient(dayProgress.value, depth);
    return [g.lit, g.mid, g.shadow];
  });

  const halfWidth = width / 2;
  const halfHeight = (height - ridgelineY) / 2;
  const centerX = halfWidth;
  const centerY = ridgelineY + halfHeight;

  const endpoints = useDerivedValue(() => {
    const dir = getLightDirection(dayProgress.value);
    return getGradientEndpoints(dir, centerX, centerY, halfWidth, halfHeight);
  });

  const gradientStart = useDerivedValue(() =>
    vec(endpoints.value.startX, endpoints.value.startY),
  );

  const gradientEnd = useDerivedValue(() =>
    vec(endpoints.value.endX, endpoints.value.endY),
  );

  if (!pathData.skPath) return null;

  return (
    <Path
      key={`${layerIndex}-${copyIndex}`}
      path={pathData.skPath}
      transform={pathTransform}
    >
      <LinearGradient
        start={gradientStart}
        end={gradientEnd}
        colors={gradientColors}
        positions={GRADIENT_POSITIONS}
        transform={shaderTransform}
      />
    </Path>
  );
}

export function TerrainLayers({ dayProgress, scrollX, width, height }: TerrainLayersProps) {
  const terrainPaths = useMemo(
    () => buildTerrainPaths(height),
    [height],
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
            width={width}
            height={height}
          />
          <TerrainCopy
            pathData={pathData}
            dayProgress={dayProgress}
            scrollX={scrollX}
            copyIndex={1}
            width={width}
            height={height}
          />
        </Group>
      ))}
    </Group>
  );
}
