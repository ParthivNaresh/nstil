import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { useTheme } from "@/hooks/useTheme";
import { spacing } from "@/styles";

import type { EmptyStateProps } from "./types";

export function EmptyState({
  icon,
  title,
  subtitle,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Icon icon={icon} size="xl" color={colors.textTertiary} />
      </View>
      <AppText variant="h3" align="center">
        {title}
      </AppText>
      {subtitle ? (
        <AppText variant="body" color={colors.textSecondary} align="center">
          {subtitle}
        </AppText>
      ) : null}
      {actionLabel && onAction ? (
        <View style={styles.action}>
          <Button title={actionLabel} onPress={onAction} variant="primary" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  iconContainer: {
    marginBottom: spacing.sm,
  },
  action: {
    marginTop: spacing.md,
    width: "100%",
  },
});
