import { useMemo } from "react";
import { View, type TextStyle, type ViewStyle } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { useTheme } from "@/hooks/useTheme";
import { radius } from "@/styles";

import type { AvatarProps, AvatarSize } from "./types";

interface SizeConfig {
  dimension: number;
  fontSize: number;
}

const SIZE_MAP: Record<AvatarSize, SizeConfig> = {
  sm: { dimension: 32, fontSize: 12 },
  md: { dimension: 40, fontSize: 14 },
  lg: { dimension: 56, fontSize: 20 },
  xl: { dimension: 72, fontSize: 28 },
};

function getInitials(name?: string, email?: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name[0].toUpperCase();
  }
  if (email) {
    return email[0].toUpperCase();
  }
  return "?";
}

export function Avatar({
  name,
  email,
  size = "md",
  accessibilityLabel,
  testID,
}: AvatarProps) {
  const { colors } = useTheme();
  const config = SIZE_MAP[size];
  const initials = useMemo(() => getInitials(name, email), [name, email]);

  const containerStyle = useMemo<ViewStyle>(
    () => ({
      width: config.dimension,
      height: config.dimension,
      borderRadius: radius.full,
      backgroundColor: colors.accentMuted,
      alignItems: "center",
      justifyContent: "center",
    }),
    [config.dimension, colors.accentMuted],
  );

  const textStyle = useMemo<TextStyle>(
    () => ({
      fontSize: config.fontSize,
      fontWeight: "600",
    }),
    [config.fontSize],
  );

  return (
    <View
      style={containerStyle}
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel ?? name ?? email ?? "Avatar"}
      testID={testID}
    >
      <AppText color={colors.accent} style={textStyle}>
        {initials}
      </AppText>
    </View>
  );
}
