import * as Haptics from "expo-haptics";
import type { LucideIcon } from "lucide-react-native";
import { useCallback } from "react";
import { Pressable, StyleSheet } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { useTheme } from "@/hooks/useTheme";
import { spacing } from "@/styles";

import { ITEM_ICON_SIZE, ITEM_ICON_STROKE } from "./styles";

interface CreateMenuItemProps {
  readonly label: string;
  readonly icon: LucideIcon;
  readonly onPress: () => void;
  readonly centerX: number;
  readonly centerY: number;
}

const HIT_SIZE = 64;

export function CreateMenuItem({ label, icon: Icon, onPress, centerX, centerY }: CreateMenuItemProps) {
  const { colors } = useTheme();

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }, [onPress]);

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[
        localStyles.item,
        {
          left: centerX - HIT_SIZE / 2,
          top: centerY - HIT_SIZE / 2,
        },
      ]}
    >
      <Icon size={ITEM_ICON_SIZE} color={colors.accent} strokeWidth={ITEM_ICON_STROKE} />
      <AppText variant="caption" color={colors.textSecondary}>
        {label}
      </AppText>
    </Pressable>
  );
}

const localStyles = StyleSheet.create({
  item: {
    position: "absolute",
    width: HIT_SIZE,
    height: HIT_SIZE,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
});
