import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { useTheme } from "@/hooks/useTheme";
import { spacing } from "@/styles";

import type { CardHeaderProps } from "./types";

export function CardHeader({ title, subtitle, right }: CardHeaderProps) {
  const { colors } = useTheme();

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
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  text: {
    flex: 1,
    gap: 2,
  },
});
