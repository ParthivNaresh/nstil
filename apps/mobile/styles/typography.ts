import type { TextStyle } from "react-native";

interface TypographyScale {
  readonly h1: TextStyle;
  readonly h2: TextStyle;
  readonly h3: TextStyle;
  readonly body: TextStyle;
  readonly bodySmall: TextStyle;
  readonly caption: TextStyle;
  readonly label: TextStyle;
}

export type TypographyVariant = keyof TypographyScale;

export const typography: TypographyScale = {
  h1: {
    fontSize: 32,
    fontWeight: "700",
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 24,
    fontWeight: "600",
    lineHeight: 32,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 20,
    fontWeight: "600",
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    fontWeight: "400",
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: "400",
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: "400",
    lineHeight: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
    letterSpacing: 0.1,
  },
} as const;
