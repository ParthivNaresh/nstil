import {
  DRIFT_CONFIG,
  STAR_FIELD_Y_FRACTION,
  STAR_MAX_RADIUS,
  STAR_MIN_RADIUS,
} from "@/lib/drift";
import type { StarPosition } from "@/lib/drift";

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const SEED = 42;

export function generateStarPositions(
  canvasWidth: number,
  canvasHeight: number,
): readonly StarPosition[] {
  const rand = seededRandom(SEED);
  const maxY = canvasHeight * STAR_FIELD_Y_FRACTION;
  const count = DRIFT_CONFIG.starCount;
  const stars: StarPosition[] = [];

  for (let i = 0; i < count; i++) {
    stars.push({
      x: rand() * canvasWidth,
      y: rand() * maxY,
      radius: STAR_MIN_RADIUS + rand() * (STAR_MAX_RADIUS - STAR_MIN_RADIUS),
    });
  }

  return stars;
}
