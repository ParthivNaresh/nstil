export interface ReminderTime {
  readonly hour: number;
  readonly minute: number;
}

export type ReminderFrequency = "daily" | "twice_daily" | "weekdays" | "custom";

export interface NotificationPreferences {
  readonly user_id: string;
  readonly reminders_enabled: boolean;
  readonly frequency: ReminderFrequency;
  readonly reminder_times: ReminderTime[];
  readonly active_days: number[];
  readonly quiet_hours_start: string | null;
  readonly quiet_hours_end: string | null;
  readonly last_notified_at: string | null;
  readonly updated_at: string;
}

export interface NotificationPreferencesUpdate {
  readonly reminders_enabled?: boolean;
  readonly frequency?: ReminderFrequency;
  readonly reminder_times?: ReminderTime[];
  readonly active_days?: number[];
  readonly quiet_hours_start?: string | null;
  readonly quiet_hours_end?: string | null;
}
