import { ActivityIndicator, Pressable, StyleSheet } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { useTheme } from "@/hooks/useTheme";
import { opacity } from "@/styles";

import type { HeaderActionProps } from "./types";

export function HeaderAction({
  title,
  onPress,
  disabled = false,
  loading = false,
}: HeaderActionProps) {
  const { colors } = useTheme();
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={[styles.container, isDisabled && styles.disabled]}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: isDisabled }}
    >
      {loading ? (
        <ActivityIndicator size="small" color={colors.accent} />
      ) : (
        <AppText variant="label" color={colors.accent}>
          {title}
        </AppText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  disabled: {
    opacity: opacity.disabled,
  },
});
