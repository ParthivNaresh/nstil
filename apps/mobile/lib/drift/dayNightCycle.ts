import { lerp } from "@/lib/animation";

import type {
  CelestialPosition,
  DayPhase,
  DirectionalGradientColors,
  GradientEndpoints,
  LightDirection,
  SkyPhaseColors,
} from "./types";

const DAWN_SKY: SkyPhaseColors = { top: "#2D1B4E", bottom: "#E87868" };
const DAY_SKY: SkyPhaseColors = { top: "#4A90D9", bottom: "#B8D8F8" };
const DUSK_SKY: SkyPhaseColors = { top: "#3A2055", bottom: "#D06878" };
const NIGHT_SKY: SkyPhaseColors = { top: "#0A0A1A", bottom: "#1A1A3E" };

const SKY_PHASES: readonly SkyPhaseColors[] = [DAWN_SKY, DAY_SKY, DUSK_SKY, NIGHT_SKY];

const STAR_FADE_IN_START = 0.6;
const STAR_FADE_IN_END = 0.75;
const STAR_FULL_END = 0.9;
const STAR_FADE_OUT_END = 1.0;

const CELESTIAL_HORIZON_FRACTION = 0.65;
const SUN_PEAK_FRACTION = 0.12;
const MOON_PEAK_FRACTION = 0.18;

const SUN_FADE_DURATION = 0.08;
const MOON_FADE_DURATION = 0.08;

const LIT_PHASE_COLORS: readonly string[] = ["#E8A878", "#D8C8A8", "#D07868", "#2A2A4E"];

const SHADOW_PHASE_COLORS: readonly string[] = ["#1A1040", "#3A4A6A", "#1A1038", "#08081A"];

const DESATURATION_STRENGTH = 0.55;

function parseHex(hex: string): [number, number, number] {
  "worklet";
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

function toHex(r: number, g: number, b: number): string {
  "worklet";
  const ri = Math.round(Math.max(0, Math.min(255, r)));
  const gi = Math.round(Math.max(0, Math.min(255, g)));
  const bi = Math.round(Math.max(0, Math.min(255, b)));

  const rh = ri < 16 ? "0" + ri.toString(16) : ri.toString(16);
  const gh = gi < 16 ? "0" + gi.toString(16) : gi.toString(16);
  const bh = bi < 16 ? "0" + bi.toString(16) : bi.toString(16);

  return "#" + rh + gh + bh;
}

function lerpColor(a: string, b: string, t: number): string {
  "worklet";
  const [ar, ag, ab] = parseHex(a);
  const [br, bg, bb] = parseHex(b);
  return toHex(lerp(ar, br, t), lerp(ag, bg, t), lerp(ab, bb, t));
}

function getPhaseAndProgress(dayProgress: number): { index: number; t: number } {
  "worklet";
  const clamped = ((dayProgress % 1) + 1) % 1;
  const scaled = clamped * 4;
  const index = Math.min(Math.floor(scaled), 3);
  const t = scaled - index;
  return { index, t };
}

function interpolateSkyBottom(dayProgress: number): string {
  "worklet";
  const { index, t } = getPhaseAndProgress(dayProgress);
  const next = (index + 1) % 4;
  return lerpColor(SKY_PHASES[index].bottom, SKY_PHASES[next].bottom, t);
}

function interpolatePhaseColor(
  phases: readonly string[],
  dayProgress: number,
): string {
  "worklet";
  const { index, t } = getPhaseAndProgress(dayProgress);
  const next = (index + 1) % 4;
  return lerpColor(phases[index], phases[next], t);
}

function desaturate(hex: string, amount: number): string {
  "worklet";
  const [r, g, b] = parseHex(hex);
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return toHex(lerp(r, luma, amount), lerp(g, luma, amount), lerp(b, luma, amount));
}

export function getSkyColors(dayProgress: number): SkyPhaseColors {
  "worklet";
  const { index, t } = getPhaseAndProgress(dayProgress);
  const next = (index + 1) % 4;
  const from = SKY_PHASES[index];
  const to = SKY_PHASES[next];
  return {
    top: lerpColor(from.top, to.top, t),
    bottom: lerpColor(from.bottom, to.bottom, t),
  };
}

export function getLightDirection(dayProgress: number): LightDirection {
  "worklet";
  const p = ((dayProgress % 1) + 1) % 1;
  const arcT = p < 0.5 ? p / 0.5 : (p - 0.5) / 0.5;
  const angle = arcT * Math.PI;
  return { dx: Math.cos(angle), dy: Math.sin(angle) };
}

export function getGradientEndpoints(
  lightDir: LightDirection,
  centerX: number,
  centerY: number,
  halfWidth: number,
  halfHeight: number,
): GradientEndpoints {
  "worklet";
  const r = Math.abs(lightDir.dx) * halfWidth + Math.abs(lightDir.dy) * halfHeight;
  return {
    startX: centerX - lightDir.dx * r,
    startY: centerY - lightDir.dy * r,
    endX: centerX + lightDir.dx * r,
    endY: centerY + lightDir.dy * r,
  };
}

export function getDirectionalGradient(
  dayProgress: number,
  depthFactor: number,
): DirectionalGradientColors {
  "worklet";
  const litBase = interpolatePhaseColor(LIT_PHASE_COLORS, dayProgress);
  const shadowBase = interpolatePhaseColor(SHADOW_PHASE_COLORS, dayProgress);
  const atmosphere = interpolateSkyBottom(dayProgress);

  const contrast = depthFactor;
  let lit = lerpColor(atmosphere, litBase, contrast);
  let shadow = lerpColor(atmosphere, shadowBase, contrast);

  const desat = (1 - depthFactor) * DESATURATION_STRENGTH;
  lit = desaturate(lit, desat);
  shadow = desaturate(shadow, desat);

  const midBias = lerp(0.6, 0.4, depthFactor);
  const mid = lerpColor(lit, shadow, midBias);

  return { lit, mid, shadow };
}

export function getStarOpacity(dayProgress: number): number {
  "worklet";
  const p = ((dayProgress % 1) + 1) % 1;

  if (p < STAR_FADE_IN_START) return 0;
  if (p < STAR_FADE_IN_END) {
    return (p - STAR_FADE_IN_START) / (STAR_FADE_IN_END - STAR_FADE_IN_START);
  }
  if (p < STAR_FULL_END) return 1;
  if (p < STAR_FADE_OUT_END) {
    return 1 - (p - STAR_FULL_END) / (STAR_FADE_OUT_END - STAR_FULL_END);
  }
  return 0;
}

function celestialArc(
  arcProgress: number,
  canvasWidth: number,
  canvasHeight: number,
  peakFraction: number,
): { x: number; y: number } {
  "worklet";
  const horizon = canvasHeight * CELESTIAL_HORIZON_FRACTION;
  const peak = canvasHeight * peakFraction;
  const margin = canvasWidth * 0.15;

  const x = lerp(margin, canvasWidth - margin, arcProgress);
  const y = horizon - (horizon - peak) * Math.sin(arcProgress * Math.PI);

  return { x, y };
}

export function getSunPosition(
  dayProgress: number,
  canvasWidth: number,
  canvasHeight: number,
): CelestialPosition {
  "worklet";
  const p = ((dayProgress % 1) + 1) % 1;

  if (p >= 0.5) return { x: 0, y: 0, opacity: 0 };

  const arcT = p / 0.5;
  const { x, y } = celestialArc(arcT, canvasWidth, canvasHeight, SUN_PEAK_FRACTION);

  const fadeIn = Math.min(arcT / SUN_FADE_DURATION, 1);
  const fadeOut = Math.min((1 - arcT) / SUN_FADE_DURATION, 1);

  return { x, y, opacity: Math.min(fadeIn, fadeOut) };
}

export function getMoonPosition(
  dayProgress: number,
  canvasWidth: number,
  canvasHeight: number,
): CelestialPosition {
  "worklet";
  const p = ((dayProgress % 1) + 1) % 1;

  if (p < 0.5) return { x: 0, y: 0, opacity: 0 };

  const arcT = (p - 0.5) / 0.5;
  const { x, y } = celestialArc(arcT, canvasWidth, canvasHeight, MOON_PEAK_FRACTION);

  const fadeIn = Math.min(arcT / MOON_FADE_DURATION, 1);
  const fadeOut = Math.min((1 - arcT) / MOON_FADE_DURATION, 1);

  return { x, y, opacity: Math.min(fadeIn, fadeOut) * 0.85 };
}

export function getDayPhase(dayProgress: number): DayPhase {
  "worklet";
  const p = ((dayProgress % 1) + 1) % 1;
  if (p < 0.25) return "dawn";
  if (p < 0.5) return "day";
  if (p < 0.75) return "dusk";
  return "night";
}

const SILHOUETTE_PHASE_COLORS: readonly string[] = [
  "#2A1510",
  "#1A2840",
  "#1A1238",
  "#0A0A20",
];

const WARM_TINT_PHASE_COLORS: readonly string[] = [
  "#F0A060",
  "#E8D0B0",
  "#E07058",
  "#2A2A4E",
];

function hexToFloat4(hex: string): readonly [number, number, number, number] {
  "worklet";
  const [r, g, b] = parseHex(hex);
  return [r / 255, g / 255, b / 255, 1.0] as const;
}

export function getSkyBottomFloat4(
  dayProgress: number,
): readonly [number, number, number, number] {
  "worklet";
  return hexToFloat4(interpolateSkyBottom(dayProgress));
}

export function getSilhouetteFloat4(
  dayProgress: number,
): readonly [number, number, number, number] {
  "worklet";
  return hexToFloat4(interpolatePhaseColor(SILHOUETTE_PHASE_COLORS, dayProgress));
}

export function getWarmTintFloat4(
  dayProgress: number,
): readonly [number, number, number, number] {
  "worklet";
  return hexToFloat4(interpolatePhaseColor(WARM_TINT_PHASE_COLORS, dayProgress));
}

export function getSunInfluence(dayProgress: number): number {
  "worklet";
  const p = ((dayProgress % 1) + 1) % 1;
  if (p < 0.5) {
    const arcT = p / 0.5;
    const fadeIn = Math.min(arcT / 0.1, 1);
    const fadeOut = Math.min((1 - arcT) / 0.1, 1);
    return Math.min(fadeIn, fadeOut);
  }
  return 0;
}
