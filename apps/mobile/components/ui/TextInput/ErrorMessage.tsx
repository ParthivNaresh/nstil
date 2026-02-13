import { StyleSheet, Text } from "react-native";

import { colors, spacing, typography } from "@/styles";

interface ErrorMessageProps {
  message: string;
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <Text style={styles.error} accessibilityRole="alert">
      {message}
    </Text>
  );
}

const styles = StyleSheet.create({
  error: {
    ...typography.caption,
    color: colors.error,
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
});
