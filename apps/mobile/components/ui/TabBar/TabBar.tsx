import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import { useCallback } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/hooks/useTheme";

import { CreateTabButton } from "./CreateTabButton";
import { CREATE_ROUTE } from "./tabIcons";
import { TabBarItem } from "./TabBarItem";
import type { TabBarProps } from "./types";

export const TAB_BAR_CONTENT_HEIGHT = 60;

export function TabBar({ state, descriptors, navigation }: TabBarProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleCreatePress = useCallback(() => {
    router.push("/entry/create");
  }, [router]);

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

          if (route.name === CREATE_ROUTE) {
            return (
              <View key={route.key} style={styles.createContainer}>
                <CreateTabButton onPress={handleCreatePress} />
              </View>
            );
          }

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
  createContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
