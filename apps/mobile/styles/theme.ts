import { duration, easing } from "./animation";
import { colors } from "./colors";
import { opacity } from "./opacity";
import { radius } from "./radius";
import { spacing } from "./spacing";
import { typography } from "./typography";

export const theme = {
  colors,
  spacing,
  typography,
  radius,
  opacity,
  duration,
  easing,
} as const;

export type Theme = typeof theme;
