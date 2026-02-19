import { useMemo } from "react";
import { Text, type TextStyle } from "react-native";

import { useTheme } from "@/hooks/useTheme";
import { typography } from "@/styles";

import type { AppTextProps } from "./types";

export function AppText({
  variant = "body",
  color,
  align,
  style,
  children,
  ...rest
}: AppTextProps) {
  const { colors } = useTheme();
  const resolvedColor = color ?? colors.textPrimary;

  const textStyle = useMemo<TextStyle>(
    () => ({
      ...typography[variant],
      color: resolvedColor,
      ...(align && { textAlign: align }),
    }),
    [variant, resolvedColor, align],
  );

  return (
    <Text style={[textStyle, style]} {...rest}>
      {children}
    </Text>
  );
}
