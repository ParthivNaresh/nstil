export const opacity = {
  disabled: 0.5,
  muted: 0.4,
  subtle: 0.7,
  full: 1,
} as const;

export type OpacityToken = keyof typeof opacity;
