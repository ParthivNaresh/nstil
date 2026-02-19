import * as Haptics from "expo-haptics";
import { useCallback, useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { AppText } from "@/components/ui/AppText";
import { Icon } from "@/components/ui/Icon";
import { useTheme } from "@/hooks/useTheme";
import { easing, radius, spacing } from "@/styles";

import { getTabIcon } from "./tabIcons";
import type { TabBarItemProps } from "./types";

const INDICATOR_HEIGHT = 3;
const INDICATOR_WIDTH = 20;

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
  const { colors } = useTheme();
  const TabIcon = getTabIcon(routeName);
  const iconColor = isFocused ? colors.accent : colors.textTertiary;
  const textColor = isFocused ? colors.accent : colors.textTertiary;
  const indicatorScale = useSharedValue(isFocused ? 1 : 0);

  useEffect(() => {
    indicatorScale.value = withSpring(isFocused ? 1 : 0, easing.spring);
  }, [isFocused, indicatorScale]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: indicatorScale.value }],
    opacity: indicatorScale.value,
  }));

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
      <Animated.View
        style={[
          styles.indicator,
          { backgroundColor: colors.accent },
          indicatorStyle,
        ]}
      />
      <View style={styles.iconContainer}>
        <Icon icon={TabIcon} size="sm" color={iconColor} />
        {badge != null && badge > 0 ? (
          <View style={[styles.badge, { backgroundColor: colors.error }]}>
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
  indicator: {
    width: INDICATOR_WIDTH,
    height: INDICATOR_HEIGHT,
    borderRadius: INDICATOR_HEIGHT / 2,
    marginBottom: 2,
  },
  iconContainer: {
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -10,
    borderRadius: radius.sm,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
});
