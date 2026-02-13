import { useMemo } from "react";
import { View, type ViewStyle } from "react-native";

import { colors } from "@/styles";

import type { DividerProps } from "./types";

export function Divider({
  color = colors.border,
  thickness = 1,
  verticalSpacing = 0,
}: DividerProps) {
  const style = useMemo<ViewStyle>(
    () => ({
      height: thickness,
      backgroundColor: color,
      marginVertical: verticalSpacing,
    }),
    [color, thickness, verticalSpacing],
  );

  return <View style={style} accessibilityRole="none" />;
}
