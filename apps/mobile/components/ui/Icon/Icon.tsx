import { colors } from "@/styles";

import type { IconProps, IconSize } from "./types";

const SIZE_MAP: Record<IconSize, number> = {
  xs: 14,
  sm: 18,
  md: 22,
  lg: 28,
  xl: 36,
};

export function Icon({
  icon: LucideIcon,
  size = "md",
  color = colors.textPrimary,
  strokeWidth = 2,
  accessibilityLabel,
  testID,
}: IconProps) {
  return (
    <LucideIcon
      size={SIZE_MAP[size]}
      color={color}
      strokeWidth={strokeWidth}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
    />
  );
}
