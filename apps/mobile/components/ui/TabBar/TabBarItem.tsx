import * as Haptics from "expo-haptics";
import { useCallback } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { Icon } from "@/components/ui/Icon";
import { colors, radius, spacing } from "@/styles";

import { getTabIcon } from "./tabIcons";
import type { TabBarItemProps } from "./types";

export function TabBarItem({
  label,
  isFocused,
  onPress,
  onLongPress,
  routeName,
  accessibilityLabel,
  accessibilityState,
  badge,
}: TabBarItemProps) {
  const TabIcon = getTabIcon(routeName);
  const iconColor = isFocused ? colors.accent : colors.textTertiary;
  const textColor = isFocused ? colors.accent : colors.textTertiary;

  const handlePress = useCallback(() => {
    if (!isFocused) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  }, [isFocused, onPress]);

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={onLongPress}
      accessibilityRole="tab"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={accessibilityState}
      style={styles.item}
    >
      <View style={styles.iconContainer}>
        <Icon icon={TabIcon} size="sm" color={iconColor} />
        {badge != null && badge > 0 ? (
          <View style={styles.badge}>
            <AppText variant="caption" color={colors.textPrimary}>
              {badge > 99 ? "99+" : String(badge)}
            </AppText>
          </View>
        ) : null}
      </View>
      <AppText variant="caption" color={textColor}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
    gap: 2,
  },
  iconContainer: {
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -10,
    backgroundColor: colors.error,
    borderRadius: radius.sm,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
});
