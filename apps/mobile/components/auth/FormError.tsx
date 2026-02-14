import { AlertCircle } from "lucide-react-native";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { useTheme } from "@/hooks/useTheme";
import { radius, spacing } from "@/styles";

import type { FormErrorProps } from "./types";

export function FormError({ message }: FormErrorProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.errorMuted }]} accessibilityRole="alert">
      <AlertCircle size={16} color={colors.error} />
      <AppText variant="bodySmall" color={colors.error} style={styles.text}>
        {message}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  text: {
    flex: 1,
  },
});
