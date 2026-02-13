import { StyleSheet, View } from "react-native";

import { colors, spacing } from "@/styles";

import type { CardFooterProps } from "./types";

export function CardFooter({ children }: CardFooterProps) {
  return (
    <View style={styles.container}>
      <View style={styles.border} />
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
    backgroundColor: colors.border,
    marginBottom: spacing.sm,
  },
});
