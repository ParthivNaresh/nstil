import * as Haptics from "expo-haptics";
import { Minus } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppText, Icon } from "@/components/ui";
import { TimePicker } from "@/components/journal/EntryDatePicker/TimePicker";
import { useTheme } from "@/hooks/useTheme";
import { withAlpha } from "@/lib/colorUtils";
import { radius, spacing } from "@/styles";
import type { ReminderTime } from "@/types";

interface ReminderTimeRowProps {
  readonly time: ReminderTime;
  readonly isQuiet: boolean;
  readonly onChange: (hour: number, minute: number) => void;
  readonly onRemove: (() => void) | null;
}

const EMIT_DELAY_MS = 300;
const WARNING_LINE_HEIGHT = 16;

export function ReminderTimeRow({
  time,
  isQuiet,
  onChange,
  onRemove,
}: ReminderTimeRowProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [local, setLocal] = useState({ hour: time.hour, minute: time.minute });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocal({ hour: time.hour, minute: time.minute });
  }, [time.hour, time.minute]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const emit = useCallback(
    (hour: number, minute: number) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        onChange(hour, minute);
      }, EMIT_DELAY_MS);
    },
    [onChange],
  );

  const handleHourChange = useCallback(
    (hour: number) => {
      setLocal((prev) => {
        const next = { hour, minute: prev.minute };
        emit(next.hour, next.minute);
        return next;
      });
    },
    [emit],
  );

  const handleMinuteChange = useCallback(
    (minute: number) => {
      setLocal((prev) => {
        const next = { hour: prev.hour, minute };
        emit(next.hour, next.minute);
        return next;
      });
    },
    [emit],
  );

  const handleRemove = useCallback(() => {
    if (!onRemove) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onRemove();
  }, [onRemove]);

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.picker}>
          <TimePicker
            hour={local.hour}
            minute={local.minute}
            onHourChange={handleHourChange}
            onMinuteChange={handleMinuteChange}
          />
        </View>
        {onRemove ? (
          <Pressable
            onPress={handleRemove}
            style={[styles.removeButton, { backgroundColor: withAlpha(colors.error, 0.1) }]}
            accessibilityRole="button"
            accessibilityLabel="Remove time"
          >
            <Icon icon={Minus} size="sm" color={colors.error} />
          </Pressable>
        ) : null}
      </View>
      <View style={styles.warningSlot}>
        {isQuiet ? (
          <AppText variant="caption" color={colors.warning}>
            {t("settings.notifications.withinQuietHours")}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  picker: {
    flex: 1,
  },
  removeButton: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  warningSlot: {
    height: WARNING_LINE_HEIGHT,
  },
});
