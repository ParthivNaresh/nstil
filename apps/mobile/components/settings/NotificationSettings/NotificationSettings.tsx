import * as Haptics from "expo-haptics";
import { Plus } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Switch, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppText, Card, Icon } from "@/components/ui";
import { useTheme } from "@/hooks/useTheme";
import { useUpdateNotificationPreferences } from "@/hooks/useNotificationPreferences";
import { withAlpha } from "@/lib/colorUtils";
import { isWithinQuietHours } from "@/lib/notifications";
import { radius, spacing } from "@/styles";
import type {
  NotificationPreferences,
  NotificationPreferencesUpdate,
  ReminderFrequency,
  ReminderTime,
} from "@/types";

import { DaySelector } from "./DaySelector";
import { FrequencyPicker } from "./FrequencyPicker";
import { QuietHoursSection } from "./QuietHoursSection";
import { ReminderTimeRow } from "./ReminderTimeRow";

interface NotificationSettingsProps {
  readonly preferences: NotificationPreferences;
}

const MAX_REMINDER_TIMES = 5;
const DEBOUNCE_MS = 500;

const WEEKDAY_DAYS = [1, 2, 3, 4, 5];
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

const DEFAULT_MORNING: ReminderTime = { hour: 9, minute: 0 };
const DEFAULT_EVENING: ReminderTime = { hour: 20, minute: 0 };

function parseQuietHour(time: string | null): { hour: number; minute: number } {
  if (!time) return { hour: 22, minute: 0 };
  const parts = time.split(":");
  return { hour: parseInt(parts[0], 10), minute: parseInt(parts[1], 10) };
}

function formatQuietHour(hour: number, minute: number): string {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`;
}

function getDefaultTimesForFrequency(frequency: ReminderFrequency): ReminderTime[] {
  switch (frequency) {
    case "daily":
    case "weekdays":
      return [DEFAULT_EVENING];
    case "twice_daily":
      return [DEFAULT_MORNING, DEFAULT_EVENING];
    case "custom":
      return [DEFAULT_EVENING];
  }
}

function getDefaultDaysForFrequency(frequency: ReminderFrequency): number[] {
  switch (frequency) {
    case "weekdays":
      return WEEKDAY_DAYS;
    case "daily":
    case "twice_daily":
    case "custom":
      return ALL_DAYS;
  }
}

export function NotificationSettings({ preferences }: NotificationSettingsProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { mutate } = useUpdateNotificationPreferences();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [remindersOn, setRemindersOn] = useState(preferences.reminders_enabled);
  const [quietOn, setQuietOn] = useState(preferences.quiet_hours_start !== null);

  useEffect(() => {
    setRemindersOn(preferences.reminders_enabled);
  }, [preferences.reminders_enabled]);

  useEffect(() => {
    setQuietOn(preferences.quiet_hours_start !== null);
  }, [preferences.quiet_hours_start]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const debouncedUpdate = useCallback(
    (update: NotificationPreferencesUpdate) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        mutate(update);
      }, DEBOUNCE_MS);
    },
    [mutate],
  );

  const immediateUpdate = useCallback(
    (update: NotificationPreferencesUpdate) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      mutate(update);
    },
    [mutate],
  );

  const handleToggleReminders = useCallback(
    (enabled: boolean) => {
      setRemindersOn(enabled);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      immediateUpdate({ reminders_enabled: enabled });
    },
    [immediateUpdate],
  );

  const handleFrequencyChange = useCallback(
    (frequency: ReminderFrequency) => {
      immediateUpdate({
        frequency,
        reminder_times: getDefaultTimesForFrequency(frequency),
        active_days: getDefaultDaysForFrequency(frequency),
      });
    },
    [immediateUpdate],
  );

  const handleTimeChange = useCallback(
    (index: number, hour: number, minute: number) => {
      const updated = preferences.reminder_times.map((existing, i) =>
        i === index ? { hour, minute } : existing,
      );
      debouncedUpdate({ reminder_times: updated });
    },
    [preferences.reminder_times, debouncedUpdate],
  );

  const handleAddTime = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updated = [...preferences.reminder_times, DEFAULT_EVENING];
    immediateUpdate({ reminder_times: updated });
  }, [preferences.reminder_times, immediateUpdate]);

  const handleRemoveTime = useCallback(
    (index: number) => {
      const updated = preferences.reminder_times.filter((_, i) => i !== index);
      immediateUpdate({ reminder_times: updated });
    },
    [preferences.reminder_times, immediateUpdate],
  );

  const handleDaysChange = useCallback(
    (days: number[]) => {
      immediateUpdate({ active_days: days });
    },
    [immediateUpdate],
  );

  const handleQuietHoursToggle = useCallback(
    (enabled: boolean) => {
      setQuietOn(enabled);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (enabled) {
        immediateUpdate({
          quiet_hours_start: formatQuietHour(22, 0),
          quiet_hours_end: formatQuietHour(7, 0),
        });
      } else {
        immediateUpdate({
          quiet_hours_start: null,
          quiet_hours_end: null,
        });
      }
    },
    [immediateUpdate],
  );

  const handleQuietHoursChange = useCallback(
    (sH: number, sM: number, eH: number, eM: number) => {
      debouncedUpdate({
        quiet_hours_start: formatQuietHour(sH, sM),
        quiet_hours_end: formatQuietHour(eH, eM),
      });
    },
    [debouncedUpdate],
  );

  const quietStart = parseQuietHour(preferences.quiet_hours_start);
  const quietEnd = parseQuietHour(preferences.quiet_hours_end);
  const isCustom = preferences.frequency === "custom";
  const canAddTime = preferences.reminder_times.length < MAX_REMINDER_TIMES;
  const canRemoveTime = preferences.reminder_times.length > 1;

  return (
    <View style={styles.container}>
      <Card>
        <View style={styles.toggleRow}>
          <AppText variant="label">
            {t("settings.notifications.reminders")}
          </AppText>
          <Switch
            value={remindersOn}
            onValueChange={handleToggleReminders}
            trackColor={{
              false: withAlpha(colors.textTertiary, 0.3),
              true: withAlpha(colors.accent, 0.4),
            }}
            thumbColor={remindersOn ? colors.accent : colors.textTertiary}
          />
        </View>
      </Card>

      {remindersOn ? (
        <>
          <Card>
            <FrequencyPicker
              value={preferences.frequency}
              onChange={handleFrequencyChange}
            />
          </Card>

          <Card>
            <View style={styles.section}>
              <AppText variant="label" color={colors.textSecondary}>
                {t("settings.notifications.reminderTimes")}
              </AppText>
              {preferences.reminder_times.map((time, index) => (
                <ReminderTimeRow
                  key={index}
                  time={time}
                  isQuiet={isWithinQuietHours(
                    time.hour,
                    time.minute,
                    preferences.quiet_hours_start,
                    preferences.quiet_hours_end,
                  )}
                  onChange={(hour, minute) => handleTimeChange(index, hour, minute)}
                  onRemove={canRemoveTime ? () => handleRemoveTime(index) : null}
                />
              ))}
              {isCustom && canAddTime ? (
                <Pressable
                  onPress={handleAddTime}
                  style={[styles.addButton, { borderColor: colors.glassBorder }]}
                  accessibilityRole="button"
                  accessibilityLabel={t("settings.notifications.addTime")}
                >
                  <Icon icon={Plus} size="sm" color={colors.accent} />
                  <AppText variant="caption" color={colors.accent}>
                    {t("settings.notifications.addTime")}
                  </AppText>
                </Pressable>
              ) : null}
            </View>
          </Card>

          {isCustom ? (
            <Card>
              <DaySelector
                activeDays={preferences.active_days}
                onChange={handleDaysChange}
              />
            </Card>
          ) : null}

          <Card>
            <QuietHoursSection
              enabled={quietOn}
              startHour={quietStart.hour}
              startMinute={quietStart.minute}
              endHour={quietEnd.hour}
              endMinute={quietEnd.minute}
              onToggle={handleQuietHoursToggle}
              onChange={handleQuietHoursChange}
            />
          </Card>
        </>
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
  section: {
    gap: spacing.md,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: radius.lg,
  },
});
