import type {
  BreathingPatternConfig,
  BreathingPatternId,
} from "@/types/breathing";

const BOX_PATTERN: BreathingPatternConfig = {
  id: "box",
  nameKey: "breathing.patterns.box.name",
  descriptionKey: "breathing.patterns.box.description",
  phases: [
    { phase: "inhale", duration: 4 },
    { phase: "hold", duration: 4 },
    { phase: "exhale", duration: 4 },
    { phase: "rest", duration: 4 },
  ],
  cycleDuration: 16,
};

const FOUR_SEVEN_EIGHT_PATTERN: BreathingPatternConfig = {
  id: "478",
  nameKey: "breathing.patterns.478.name",
  descriptionKey: "breathing.patterns.478.description",
  phases: [
    { phase: "inhale", duration: 4 },
    { phase: "hold", duration: 7 },
    { phase: "exhale", duration: 8 },
  ],
  cycleDuration: 19,
};

const CALM_PATTERN: BreathingPatternConfig = {
  id: "calm",
  nameKey: "breathing.patterns.calm.name",
  descriptionKey: "breathing.patterns.calm.description",
  phases: [
    { phase: "inhale", duration: 4 },
    { phase: "exhale", duration: 6 },
  ],
  cycleDuration: 10,
};

export const BREATHING_PATTERNS: ReadonlyMap<BreathingPatternId, BreathingPatternConfig> = new Map([
  ["box", BOX_PATTERN],
  ["478", FOUR_SEVEN_EIGHT_PATTERN],
  ["calm", CALM_PATTERN],
]);

export const BREATHING_PATTERN_LIST: readonly BreathingPatternConfig[] = [
  BOX_PATTERN,
  FOUR_SEVEN_EIGHT_PATTERN,
  CALM_PATTERN,
];

export function getBreathingPattern(id: BreathingPatternId): BreathingPatternConfig {
  const pattern = BREATHING_PATTERNS.get(id);
  if (!pattern) {
    throw new Error(`Unknown breathing pattern: ${id}`);
  }
  return pattern;
}

export function computeCycleCount(patternId: BreathingPatternId, durationSeconds: number): number {
  const pattern = getBreathingPattern(patternId);
  return Math.max(1, Math.floor(durationSeconds / pattern.cycleDuration));
}

export function computeSessionDuration(patternId: BreathingPatternId, cycles: number): number {
  const pattern = getBreathingPattern(patternId);
  return cycles * pattern.cycleDuration;
}
