import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";

export type TabBarProps = BottomTabBarProps;

export interface TabBarItemProps {
  label: string;
  isFocused: boolean;
  onPress: () => void;
  onLongPress: () => void;
  routeName: string;
  accessibilityLabel: string | undefined;
  accessibilityState: { selected: boolean };
  badge?: number;
}
