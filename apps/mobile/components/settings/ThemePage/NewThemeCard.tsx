import * as Haptics from "expo-haptics";
import { Plus } from "lucide-react-native";
import { useCallback } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppText } from "@/components/ui/AppText";
import { Icon } from "@/components/ui/Icon";
import { useTheme } from "@/hooks/useTheme";
import { radius, spacing } from "@/styles";

interface NewThemeCardProps {
  readonly onPress: () => void;
  readonly disabled: boolean;
}

const ICON_CONTAINER_SIZE = 48;

export function NewThemeCard({ onPress, disabled }: NewThemeCardProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const handlePress = useCallback(() => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }, [disabled, onPress]);

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      style={[
        styles.card,
        {
          borderColor: colors.glassBorder,
          backgroundColor: colors.glass,
          opacity: disabled ? 0.4 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={t("settings.customTheme.newTheme")}
      accessibilityState={{ disabled }}
    >
      <View style={[styles.iconContainer, { backgroundColor: colors.accentMuted }]}>
        <Icon icon={Plus} size="md" color={colors.accent} />
      </View>

      <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
        {t("settings.customTheme.newLabel")}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    alignItems: "center",
    borderWidth: 1,
    borderRadius: radius.md,
    borderStyle: "dashed",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    gap: spacing.xs,
  },
  iconContainer: {
    width: ICON_CONTAINER_SIZE,
    height: ICON_CONTAINER_SIZE,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
});
