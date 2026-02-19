import { Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { useTheme } from "@/hooks/useTheme";
import { radius, spacing } from "@/styles";

import type { EmptyStateProps } from "./types";

export function EmptyState({
  icon,
  title,
  subtitle,
  actionLabel,
  onAction,
  variant = "default",
}: EmptyStateProps) {
  const { colors } = useTheme();
  const isMinimal = variant === "minimal";
  const isSubtle = variant === "subtle";

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Icon icon={icon} size="xl" color={colors.textTertiary} />
      </View>
      <AppText
        variant={isSubtle || isMinimal ? "body" : "h3"}
        align="center"
        color={isSubtle || isMinimal ? colors.textSecondary : colors.textPrimary}
      >
        {title}
      </AppText>
      {subtitle ? (
        <AppText variant="body" color={colors.textTertiary} align="center">
          {subtitle}
        </AppText>
      ) : null}
      {actionLabel && onAction ? (
        isMinimal ? (
          <Pressable
            onPress={onAction}
            style={[styles.minimalAction, { borderColor: colors.glassBorder }]}
            hitSlop={8}
          >
            <AppText variant="body" color={colors.textTertiary}>
              {actionLabel}
            </AppText>
          </Pressable>
        ) : (
          <View style={isSubtle ? styles.subtleAction : styles.action}>
            <Button
              title={actionLabel}
              onPress={onAction}
              variant={isSubtle ? "secondary" : "primary"}
            />
          </View>
        )
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
  subtleAction: {
    marginTop: spacing.sm,
  },
  minimalAction: {
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderRadius: radius.md,
  },
});
