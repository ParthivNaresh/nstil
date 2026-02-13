import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";

export interface ScrollContainerProps {
  children: ReactNode;
  onRefresh?: () => void;
  refreshing?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
  keyboardAware?: boolean;
}
