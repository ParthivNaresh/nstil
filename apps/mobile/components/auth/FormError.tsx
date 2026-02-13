import { AlertCircle } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";

import { colors, spacing, typography } from "@/styles";

import type { FormErrorProps } from "./types";

export function FormError({ message }: FormErrorProps) {
  return (
    <View style={styles.container} accessibilityRole="alert">
      <AlertCircle size={16} color={colors.error} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.errorMuted,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  text: {
    ...typography.bodySmall,
    color: colors.error,
    flex: 1,
  },
});
