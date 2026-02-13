import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { colors, spacing } from "@/styles";

import type { CardHeaderProps } from "./types";

export function CardHeader({ title, subtitle, right }: CardHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.text}>
        <AppText variant="label">{title}</AppText>
        {subtitle ? (
          <AppText variant="caption" color={colors.textSecondary}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  right: {
    marginLeft: spacing.sm,
  },
});
