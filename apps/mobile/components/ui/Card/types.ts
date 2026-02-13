import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";

export type CardVariant = "glass" | "elevated";

export interface CardProps {
  children: ReactNode;
  onPress?: () => void;
  variant?: CardVariant;
  showChevron?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  testID?: string;
}

export interface CardHeaderProps {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}

export interface CardFooterProps {
  children: ReactNode;
}
