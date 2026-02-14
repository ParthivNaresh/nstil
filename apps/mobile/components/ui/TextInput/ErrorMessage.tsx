import { StyleSheet, Text } from "react-native";

import { useTheme } from "@/hooks/useTheme";
import { spacing, typography } from "@/styles";

interface ErrorMessageProps {
  message: string;
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  const { colors } = useTheme();

  return (
    <Text style={[styles.error, { color: colors.error }]}>
      {message}
    </Text>
  );
}

const styles = StyleSheet.create({
  error: {
    ...typography.caption,
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
});
