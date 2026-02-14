import { useMemo } from "react";
import { View, type ViewStyle } from "react-native";

import { useTheme } from "@/hooks/useTheme";

import type { DividerProps } from "./types";

export function Divider({
  color,
  thickness = 1,
  verticalSpacing = 0,
}: DividerProps) {
  const { colors } = useTheme();
  const resolvedColor = color ?? colors.border;

  const style = useMemo<ViewStyle>(
    () => ({
      height: thickness,
      backgroundColor: resolvedColor,
      marginVertical: verticalSpacing,
    }),
    [resolvedColor, thickness, verticalSpacing],
  );

  return <View style={style} accessibilityRole="none" />;
}
