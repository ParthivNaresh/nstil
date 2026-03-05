export function lerp(from: number, to: number, t: number): number {
  "worklet";
  return from + (to - from) * t;
}
