import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/hooks/useTheme";

import { CreateMenu } from "./CreateMenu";
import { CreateTabButton } from "./CreateTabButton";
import { CREATE_ROUTE } from "./tabIcons";
import { TabBarItem } from "./TabBarItem";
import type { TabBarProps } from "./types";

export const TAB_BAR_CONTENT_HEIGHT = 60;
const CREATE_BUTTON_LIFT = 16;

export function TabBar({ state, descriptors, navigation }: TabBarProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [menuVisible, setMenuVisible] = useState(false);

  const buttonCenterY =
    screenHeight - insets.bottom - TAB_BAR_CONTENT_HEIGHT / 2 - CREATE_BUTTON_LIFT;

  const handleCreatePress = useCallback(() => {
    setMenuVisible((prev) => !prev);
  }, []);

  const handleMenuClose = useCallback(() => {
    setMenuVisible(false);
  }, []);

  const handleNewEntry = useCallback(() => {
    setMenuVisible(false);
    router.push("/entry/create");
  }, [router]);

  const handleNewJournal = useCallback(() => {
    setMenuVisible(false);
    router.push("/journal/create");
  }, [router]);

  return (
    <>
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
                <View key={route.key} style={styles.createPlaceholder} />
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
      <CreateMenu
        visible={menuVisible}
        onClose={handleMenuClose}
        onNewEntry={handleNewEntry}
        onNewJournal={handleNewJournal}
        anchorY={buttonCenterY}
      />
      <View
        style={[
          styles.createButtonContainer,
          {
            left: screenWidth / 2 - 32,
            bottom: insets.bottom + TAB_BAR_CONTENT_HEIGHT / 2 - 32 + CREATE_BUTTON_LIFT,
          },
        ]}
        pointerEvents="box-none"
      >
        <CreateTabButton onPress={handleCreatePress} isMenuOpen={menuVisible} />
      </View>
    </>
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
  createPlaceholder: {
    flex: 1,
  },
  createButtonContainer: {
    position: "absolute",
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
  },
});
