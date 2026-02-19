import { StyleSheet, type ViewStyle } from "react-native";

import { radius, spacing } from "@/styles";
import type { ColorPalette } from "@/styles/palettes";

import type { CardVariant } from "./types";

function baseCard(colors: ColorPalette): ViewStyle {
  return {
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: radius.xl,
    padding: spacing.md,
  };
}

export function getCardVariantStyle(
  variant: CardVariant,
  colors: ColorPalette,
): ViewStyle {
  const base = baseCard(colors);
  switch (variant) {
    case "glass":
      return { ...base, backgroundColor: colors.glass };
    case "elevated":
      return { ...base, backgroundColor: colors.surfaceElevated };
  }
}

export const cardStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  content: {
    flex: 1,
  },
  chevron: {
    marginLeft: spacing.sm,
  },
});
