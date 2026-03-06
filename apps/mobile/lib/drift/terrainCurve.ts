import { Skia } from "@shopify/react-native-skia";

import type { TerrainLayerConfig } from "./types";

const TWO_PI = 2 * Math.PI;

function rawHarmonicSum(
  x: number,
  harmonics: TerrainLayerConfig["harmonics"],
  invLoop: number,
): number {
  "worklet";
  let sum = 0;
  for (let i = 0; i < harmonics.length; i++) {
    const h = harmonics[i];
    sum += h.amplitude * Math.sin(h.k * invLoop * x + h.phase);
  }
  return sum;
}

export function getHarmonicHeight(x: number, layer: TerrainLayerConfig): number {
  "worklet";
  const invLoop = TWO_PI / layer.loopWidth;

  const warpedX =
    x +
    layer.warp.amplitude *
      Math.sin(layer.warp.k * invLoop * x + layer.warp.phase);

  const raw = rawHarmonicSum(warpedX, layer.harmonics, invLoop);

  if (layer.ridgeBlend <= 0) return raw;

  let maxAmp = 0;
  for (let i = 0; i < layer.harmonics.length; i++) {
    maxAmp += Math.abs(layer.harmonics[i].amplitude);
  }
  if (maxAmp === 0) return raw;

  const normalized = raw / maxAmp;
  const ridge = 1 - Math.abs(normalized);
  const shaped = Math.pow(ridge, layer.ridgeExponent);
  const ridgeScaled = shaped * maxAmp;

  return raw + (ridgeScaled - raw) * layer.ridgeBlend;
}

export function getTerrainHeight(
  x: number,
  layer: TerrainLayerConfig,
  canvasHeight: number,
): number {
  "worklet";
  const harmonicOffset = getHarmonicHeight(x, layer);
  return canvasHeight * layer.baseHeight + harmonicOffset;
}

export function computeRidgelineY(
  layer: TerrainLayerConfig,
  canvasHeight: number,
): number {
  let maxUpward = 0;
  for (let i = 0; i < layer.harmonics.length; i++) {
    maxUpward += Math.abs(layer.harmonics[i].amplitude);
  }
  return canvasHeight * layer.baseHeight - maxUpward;
}

export function generateTerrainPath(
  canvasHeight: number,
  layer: TerrainLayerConfig,
): string {
  const { loopWidth, pointCount } = layer;
  const path = Skia.Path.Make();
  const step = loopWidth / pointCount;

  const startY = getTerrainHeight(0, layer, canvasHeight);
  path.moveTo(0, startY);

  for (let i = 1; i <= pointCount; i++) {
    const x = i * step;
    const y = getTerrainHeight(x, layer, canvasHeight);
    path.lineTo(x, y);
  }

  path.lineTo(loopWidth, canvasHeight);
  path.lineTo(0, canvasHeight);
  path.close();

  return path.toSVGString();
}
