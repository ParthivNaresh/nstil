import type { TextProps as RNTextProps } from "react-native";

import type { TypographyVariant } from "@/styles";

export interface AppTextProps extends RNTextProps {
  variant?: TypographyVariant;
  color?: string;
  align?: "left" | "center" | "right";
}
