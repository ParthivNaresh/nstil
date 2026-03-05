import { lerp } from "@/lib/animation";

import type { CelestialPosition, DayPhase, SkyPhaseColors } from "./types";

const DAWN_SKY: SkyPhaseColors = { top: "#2D1B4E", bottom: "#F4845F" };
const DAY_SKY: SkyPhaseColors = { top: "#4A90D9", bottom: "#B8D8F8" };
const DUSK_SKY: SkyPhaseColors = { top: "#4A2545", bottom: "#E8734A" };
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

const NEAR_SILHOUETTE_DAWN = "#1A0E08";
const NEAR_SILHOUETTE_DAY = "#0E1A28";
const NEAR_SILHOUETTE_DUSK = "#0E0A1E";
const NEAR_SILHOUETTE_NIGHT = "#050510";

const NEAR_SILHOUETTES: readonly string[] = [
  NEAR_SILHOUETTE_DAWN,
  NEAR_SILHOUETTE_DAY,
  NEAR_SILHOUETTE_DUSK,
  NEAR_SILHOUETTE_NIGHT,
];

export function getTerrainTint(dayProgress: number, depthFactor: number): string {
  "worklet";
  const { index, t } = getPhaseAndProgress(dayProgress);
  const next = (index + 1) % 4;

  const fromSky = SKY_PHASES[index];
  const toSky = SKY_PHASES[next];
  const skyBottom = lerpColor(fromSky.bottom, toSky.bottom, t);

  const fromNear = NEAR_SILHOUETTES[index];
  const toNear = NEAR_SILHOUETTES[next];
  const nearColor = lerpColor(fromNear, toNear, t);

  return lerpColor(skyBottom, nearColor, depthFactor);
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
