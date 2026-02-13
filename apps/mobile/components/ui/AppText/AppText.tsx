import { useMemo } from "react";
import { Text, type TextStyle } from "react-native";

import { colors, typography } from "@/styles";

import type { AppTextProps } from "./types";

export function AppText({
  variant = "body",
  color = colors.textPrimary,
  align,
  style,
  children,
  ...rest
}: AppTextProps) {
  const textStyle = useMemo<TextStyle>(
    () => ({
      ...typography[variant],
      color,
      ...(align && { textAlign: align }),
    }),
    [variant, color, align],
  );

  return (
    <Text style={[textStyle, style]} {...rest}>
      {children}
    </Text>
  );
}
