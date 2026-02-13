import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { colors, spacing } from "@/styles";

import type { AuthHeaderProps } from "./types";

export function AuthHeader({ title, subtitle }: AuthHeaderProps) {
  return (
    <View style={styles.container}>
      <AppText variant="h1">{title}</AppText>
      <AppText variant="body" color={colors.textSecondary} align="center">
        {subtitle}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: spacing.sm,
  },
});
