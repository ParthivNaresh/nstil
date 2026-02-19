import { StyleSheet, type TextStyle, type ViewStyle } from "react-native";

import { opacity, radius, spacing, typography } from "@/styles";
import type { ColorPalette } from "@/styles/palettes";

import type { ButtonVariant } from "./types";

interface ButtonStyles {
  container: ViewStyle;
  text: TextStyle;
}

const baseContainer: ViewStyle = {
  height: 52,
  borderRadius: radius.md,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  paddingHorizontal: spacing.lg,
  minWidth: 48,
  minHeight: 48,
};

const baseText: TextStyle = {
  ...typography.label,
  fontSize: 16,
  fontWeight: "600",
};

export function getVariantStyles(
  variant: ButtonVariant,
  colors: ColorPalette,
): ButtonStyles {
  switch (variant) {
    case "primary":
      return {
        container: { ...baseContainer, backgroundColor: colors.accent },
        text: { ...baseText, color: colors.textPrimary },
      };
    case "secondary":
      return {
        container: {
          ...baseContainer,
          backgroundColor: "transparent",
          borderWidth: 1,
          borderColor: colors.glassBorder,
        },
        text: { ...baseText, color: colors.accent },
      };
    case "ghost":
      return {
        container: { ...baseContainer, backgroundColor: "transparent" },
        text: { ...baseText, color: colors.accent },
      };
  }
}

export const buttonStyles = StyleSheet.create({
  disabled: {
    opacity: opacity.disabled,
  },
});
