export const duration = {
  instant: 100,
  fast: 200,
  normal: 300,
  slow: 500,
} as const;

export const easing = {
  spring: { damping: 15, stiffness: 150 },
  springBouncy: { damping: 12, stiffness: 200 },
  springGentle: { damping: 20, stiffness: 120 },
} as const;

export type DurationToken = keyof typeof duration;
export type EasingToken = keyof typeof easing;
