import type { LucideIcon } from "lucide-react-native";

export type IconSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface IconProps {
  icon: LucideIcon;
  size?: IconSize;
  color?: string;
  strokeWidth?: number;
  accessibilityLabel?: string;
  testID?: string;
}
