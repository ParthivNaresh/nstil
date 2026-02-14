import { StyleSheet, View } from "react-native";

import { useTheme } from "@/hooks/useTheme";
import { spacing } from "@/styles";

import type { CardFooterProps } from "./types";

export function CardFooter({ children }: CardFooterProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.border, { backgroundColor: colors.border }]} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.sm,
  },
  border: {
    height: 1,
    marginBottom: spacing.sm,
  },
});
