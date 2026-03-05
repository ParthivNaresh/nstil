export function lerp(from: number, to: number, t: number): number {
  "worklet";
  return from + (to - from) * t;
}

export function clamp(value: number, min: number, max: number): number {
  "worklet";
  return Math.min(Math.max(value, min), max);
}
