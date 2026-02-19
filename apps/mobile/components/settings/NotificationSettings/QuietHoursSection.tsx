import { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, Switch, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppText } from "@/components/ui";
import { TimePicker } from "@/components/journal/EntryDatePicker/TimePicker";
import { useTheme } from "@/hooks/useTheme";
import { withAlpha } from "@/lib/colorUtils";
import { spacing } from "@/styles";

interface QuietHoursSectionProps {
  readonly enabled: boolean;
  readonly startHour: number;
  readonly startMinute: number;
  readonly endHour: number;
  readonly endMinute: number;
  readonly onToggle: (enabled: boolean) => void;
  readonly onChange: (
    startHour: number,
    startMinute: number,
    endHour: number,
    endMinute: number,
  ) => void;
}

const EMIT_DELAY_MS = 300;

interface TimePair {
  readonly hour: number;
  readonly minute: number;
}

export function QuietHoursSection({
  enabled,
  startHour,
  startMinute,
  endHour,
  endMinute,
  onToggle,
  onChange,
}: QuietHoursSectionProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const [localStart, setLocalStart] = useState<TimePair>({ hour: startHour, minute: startMinute });
  const [localEnd, setLocalEnd] = useState<TimePair>({ hour: endHour, minute: endMinute });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocalStart({ hour: startHour, minute: startMinute });
  }, [startHour, startMinute]);

  useEffect(() => {
    setLocalEnd({ hour: endHour, minute: endMinute });
  }, [endHour, endMinute]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const emitBoth = useCallback(
    (start: TimePair, end: TimePair) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        onChange(start.hour, start.minute, end.hour, end.minute);
      }, EMIT_DELAY_MS);
    },
    [onChange],
  );

  const handleStartHour = useCallback(
    (hour: number) => {
      setLocalStart((prev) => {
        const next = { hour, minute: prev.minute };
        setLocalEnd((end) => {
          emitBoth(next, end);
          return end;
        });
        return next;
      });
    },
    [emitBoth],
  );

  const handleStartMinute = useCallback(
    (minute: number) => {
      setLocalStart((prev) => {
        const next = { hour: prev.hour, minute };
        setLocalEnd((end) => {
          emitBoth(next, end);
          return end;
        });
        return next;
      });
    },
    [emitBoth],
  );

  const handleEndHour = useCallback(
    (hour: number) => {
      setLocalEnd((prev) => {
        const next = { hour, minute: prev.minute };
        setLocalStart((start) => {
          emitBoth(start, next);
          return start;
        });
        return next;
      });
    },
    [emitBoth],
  );

  const handleEndMinute = useCallback(
    (minute: number) => {
      setLocalEnd((prev) => {
        const next = { hour: prev.hour, minute };
        setLocalStart((start) => {
          emitBoth(start, next);
          return start;
        });
        return next;
      });
    },
    [emitBoth],
  );

  return (
    <View style={styles.container}>
      <View style={styles.toggleRow}>
        <AppText variant="label" color={colors.textSecondary}>
          {t("settings.notifications.quietHours")}
        </AppText>
        <Switch
          value={enabled}
          onValueChange={onToggle}
          trackColor={{
            false: withAlpha(colors.textTertiary, 0.3),
            true: withAlpha(colors.accent, 0.4),
          }}
          thumbColor={enabled ? colors.accent : colors.textTertiary}
        />
      </View>
      {enabled ? (
        <View style={styles.timePickers}>
          <View style={styles.timeBlock}>
            <AppText variant="caption" color={colors.textTertiary}>
              {t("settings.notifications.quietStart")}
            </AppText>
            <TimePicker
              hour={localStart.hour}
              minute={localStart.minute}
              onHourChange={handleStartHour}
              onMinuteChange={handleStartMinute}
              compact
            />
          </View>
          <View style={styles.timeBlock}>
            <AppText variant="caption" color={colors.textTertiary}>
              {t("settings.notifications.quietEnd")}
            </AppText>
            <TimePicker
              hour={localEnd.hour}
              minute={localEnd.minute}
              onHourChange={handleEndHour}
              onMinuteChange={handleEndMinute}
              compact
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  timePickers: {
    flexDirection: "row",
    gap: spacing.md,
  },
  timeBlock: {
    flex: 1,
    gap: spacing.xs,
  },
});
