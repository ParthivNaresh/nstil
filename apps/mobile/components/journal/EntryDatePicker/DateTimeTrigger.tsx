import { Calendar } from "lucide-react-native";
import { Pressable, StyleSheet } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { Icon } from "@/components/ui/Icon";
import { useTheme } from "@/hooks/useTheme";
import { formatFullDateTime } from "@/lib/formatFullDate";
import { spacing } from "@/styles";

import type { DateTimeTriggerProps } from "./types";

export function DateTimeTrigger({
  value,
  isBackdated,
  onPress,
}: DateTimeTriggerProps) {
  const { colors } = useTheme();
  const color = isBackdated ? colors.accent : colors.textTertiary;
  const formatted = formatFullDateTime(value);

  return (
    <Pressable
      onPress={onPress}
      style={styles.trigger}
      accessibilityRole="button"
      accessibilityLabel={formatted}
    >
      <Icon icon={Calendar} size="xs" color={color} />
      <AppText variant="caption" color={color}>
        {formatted}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    alignSelf: "flex-start",
    paddingVertical: 2,
  },
});
