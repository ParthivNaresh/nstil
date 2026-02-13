import { ActivityIndicator, StyleSheet } from "react-native";

import { colors } from "@/styles";

import type { ButtonVariant } from "./types";

interface ButtonSpinnerProps {
  variant: ButtonVariant;
}

const SPINNER_COLORS: Record<ButtonVariant, string> = {
  primary: colors.textPrimary,
  secondary: colors.accent,
  ghost: colors.accent,
};

export function ButtonSpinner({ variant }: ButtonSpinnerProps) {
  return (
    <ActivityIndicator
      size="small"
      color={SPINNER_COLORS[variant]}
      style={styles.spinner}
    />
  );
}

const styles = StyleSheet.create({
  spinner: {
    marginRight: 8,
  },
});
