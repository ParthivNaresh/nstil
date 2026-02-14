import { ActivityIndicator, Pressable, StyleSheet } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { colors, opacity } from "@/styles";

import type { HeaderActionProps } from "./types";

const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 };

export function HeaderAction({
  title,
  onPress,
  loading = false,
  disabled = false,
}: HeaderActionProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      hitSlop={HIT_SLOP}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={isDisabled ? styles.disabled : undefined}
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
  disabled: {
    opacity: opacity.disabled,
  },
});
