import { Eye, EyeOff } from "lucide-react-native";
import { Pressable, StyleSheet } from "react-native";

import { colors } from "@/styles";

interface SecureToggleProps {
  isSecure: boolean;
  onToggle: () => void;
  showLabel: string;
  hideLabel: string;
}

const ICON_SIZE = 20;
const HIT_SLOP = 8;

export function SecureToggle({ isSecure, onToggle, showLabel, hideLabel }: SecureToggleProps) {
  const Icon = isSecure ? EyeOff : Eye;

  return (
    <Pressable
      onPress={onToggle}
      style={styles.toggle}
      hitSlop={HIT_SLOP}
      accessibilityRole="button"
      accessibilityLabel={isSecure ? showLabel : hideLabel}
    >
      <Icon size={ICON_SIZE} color={colors.textTertiary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  toggle: {
    position: "absolute",
    right: 16,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    minWidth: 48,
    minHeight: 48,
    alignItems: "center",
  },
});
