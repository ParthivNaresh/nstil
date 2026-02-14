import { useTheme } from "@/hooks/useTheme";

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
  color,
  strokeWidth = 2,
  accessibilityLabel,
  testID,
}: IconProps) {
  const { colors } = useTheme();
  const resolvedColor = color ?? colors.textPrimary;

  return (
    <LucideIcon
      size={SIZE_MAP[size]}
      color={resolvedColor}
      strokeWidth={strokeWidth}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
    />
  );
}
