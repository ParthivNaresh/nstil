import { StyleSheet, type TextStyle, type ViewStyle } from "react-native";

import { colors, spacing, typography } from "@/styles";

import type { ButtonVariant } from "./types";

interface ButtonStyles {
  container: ViewStyle;
  text: TextStyle;
}

const baseContainer: ViewStyle = {
  height: 52,
  borderRadius: 12,
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

const variantStyles: Record<ButtonVariant, ButtonStyles> = {
  primary: {
    container: {
      ...baseContainer,
      backgroundColor: colors.accent,
    },
    text: {
      ...baseText,
      color: colors.textPrimary,
    },
  },
  secondary: {
    container: {
      ...baseContainer,
      backgroundColor: "transparent",
      borderWidth: 1,
      borderColor: colors.glassBorder,
    },
    text: {
      ...baseText,
      color: colors.accent,
    },
  },
  ghost: {
    container: {
      ...baseContainer,
      backgroundColor: "transparent",
    },
    text: {
      ...baseText,
      color: colors.accent,
    },
  },
};

export function getVariantStyles(variant: ButtonVariant): ButtonStyles {
  return variantStyles[variant];
}

export const buttonStyles = StyleSheet.create({
  disabled: {
    opacity: 0.5,
  },
});
