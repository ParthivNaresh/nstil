import { BlurView } from "expo-blur";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/hooks/useTheme";

import { TabBarItem } from "./TabBarItem";
import type { TabBarProps } from "./types";

export function TabBar({ state, descriptors, navigation }: TabBarProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <BlurView intensity={40} tint={isDark ? "dark" : "light"} style={styles.blur}>
      <View style={[styles.borderTop, { backgroundColor: colors.border }]} />
      <View style={[styles.container, { paddingBottom: insets.bottom }]}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label =
            typeof options.tabBarLabel === "string"
              ? options.tabBarLabel
              : options.title ?? route.name;
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: "tabLongPress",
              target: route.key,
            });
          };

          return (
            <TabBarItem
              key={route.key}
              label={label}
              isFocused={isFocused}
              onPress={onPress}
              onLongPress={onLongPress}
              routeName={route.name}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              accessibilityState={{ selected: isFocused }}
            />
          );
        })}
      </View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  blur: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  borderTop: {
    height: 1,
  },
  container: {
    flexDirection: "row",
    backgroundColor: "transparent",
  },
});
