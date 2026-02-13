import type { ReactNode } from "react";
import { StyleSheet, type ViewStyle, View } from "react-native";

import { colors, spacing } from "@/styles";

interface GlassCardProps {
  children: ReactNode;
  style?: ViewStyle;
}

export function GlassCard({ children, style }: GlassCardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: 20,
    padding: spacing.lg,
    overflow: "hidden",
  },
});
