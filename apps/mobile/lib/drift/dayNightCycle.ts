import type { DayPhase } from "./types";

export function getDayPhase(dayProgress: number): DayPhase {
  "worklet";
  const p = ((dayProgress % 1) + 1) % 1;
  if (p < 0.25) return "dawn";
  if (p < 0.5) return "day";
  if (p < 0.75) return "dusk";
  return "night";
}
