import { ActivityIndicator, StyleSheet } from "react-native";

import { useTheme } from "@/hooks/useTheme";
import type { ColorPalette } from "@/styles/palettes";

import type { ButtonVariant } from "./types";

interface ButtonSpinnerProps {
  variant: ButtonVariant;
}

function getSpinnerColor(variant: ButtonVariant, colors: ColorPalette): string {
  switch (variant) {
    case "primary":
      return colors.textPrimary;
    case "secondary":
    case "ghost":
      return colors.accent;
  }
}

export function ButtonSpinner({ variant }: ButtonSpinnerProps) {
  const { colors } = useTheme();

  return (
    <ActivityIndicator
      size="small"
      color={getSpinnerColor(variant, colors)}
      style={styles.spinner}
    />
  );
}

const styles = StyleSheet.create({
  spinner: {
    marginRight: 8,
  },
});
