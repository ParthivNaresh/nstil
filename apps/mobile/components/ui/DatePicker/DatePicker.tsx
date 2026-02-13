import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Calendar } from "lucide-react-native";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Platform, Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { Icon } from "@/components/ui/Icon";
import { colors, radius, spacing } from "@/styles";

import { formatDateForDisplay } from "./formatDate";
import type { DatePickerProps } from "./types";

export function DatePicker({
  label,
  value,
  onChange,
  mode = "date",
  minimumDate,
  maximumDate,
  accessibilityLabel,
  testID,
}: DatePickerProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const handleChange = useCallback(
    (_event: DateTimePickerEvent, selectedDate?: Date) => {
      if (Platform.OS === "android") {
        setIsOpen(false);
      }
      if (selectedDate) {
        onChange(selectedDate);
      }
    },
    [onChange],
  );

  const handlePress = useCallback(() => {
    setIsOpen(true);
  }, []);

  const handleDismiss = useCallback(() => {
    setIsOpen(false);
  }, []);

  const displayValue = formatDateForDisplay(value, mode);
  const pickerMode = mode === "datetime" ? "date" : mode;

  return (
    <View style={styles.container} testID={testID}>
      <AppText variant="caption" color={colors.textSecondary}>
        {label}
      </AppText>
      <Pressable
        onPress={handlePress}
        style={styles.trigger}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
      >
        <Icon icon={Calendar} size="sm" color={colors.textSecondary} />
        <AppText variant="body">{displayValue}</AppText>
      </Pressable>

      {isOpen ? (
        <View style={styles.pickerContainer}>
          <DateTimePicker
            value={value}
            mode={pickerMode}
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={handleChange}
            minimumDate={minimumDate}
            maximumDate={maximumDate}
            themeVariant="dark"
          />
          {Platform.OS === "ios" ? (
            <Pressable onPress={handleDismiss} style={styles.doneButton}>
              <AppText variant="label" color={colors.accent}>
                {t("common.done")}
              </AppText>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    gap: spacing.xs,
  },
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    minHeight: 48,
  },
  pickerContainer: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    overflow: "hidden",
  },
  doneButton: {
    alignItems: "flex-end",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
