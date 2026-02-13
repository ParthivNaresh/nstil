import { StyleSheet, type ViewStyle } from "react-native";

import { colors, opacity, radius, spacing } from "@/styles";

import type { CardVariant } from "./types";

const baseCard: ViewStyle = {
  borderWidth: 1,
  borderColor: colors.glassBorder,
  borderRadius: radius.xl,
  padding: spacing.md,
  overflow: "hidden",
};

const variantStyles: Record<CardVariant, ViewStyle> = {
  glass: {
    ...baseCard,
    backgroundColor: colors.glass,
  },
  elevated: {
    ...baseCard,
    backgroundColor: colors.surfaceElevated,
  },
};

export function getCardVariantStyle(variant: CardVariant): ViewStyle {
  return variantStyles[variant];
}

export const cardStyles = StyleSheet.create({
  pressable: {
    flexDirection: "row",
    alignItems: "center",
  },
  content: {
    flex: 1,
  },
  chevron: {
    marginLeft: spacing.sm,
    opacity: opacity.muted,
  },
});
