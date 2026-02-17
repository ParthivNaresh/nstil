import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { getRandomNudgeMessage } from "@/lib/nudgeContent";
import type { ReminderTime } from "@/types";

export type NotificationPermissionStatus = Notifications.PermissionStatus;

export const PermissionStatus = Notifications.PermissionStatus;

export interface SchedulablePreferences {
  readonly reminderTimes: readonly ReminderTime[];
  readonly activeDays: readonly number[];
  readonly quietHoursStart: string | null;
  readonly quietHoursEnd: string | null;
}

const ANDROID_CHANNEL_ID = "reminders";
const NOTIFICATION_TITLE = "NStil";

export function configureNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
      priority: Notifications.AndroidNotificationPriority.DEFAULT,
    }),
  });
}

export async function getPermissionStatus(): Promise<NotificationPermissionStatus> {
  const { status } = await Notifications.getPermissionsAsync();
  return status;
}

export async function requestPermission(): Promise<NotificationPermissionStatus> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === Notifications.PermissionStatus.GRANTED) {
    return existing;
  }

  const { status } = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowSound: true,
      allowBadge: false,
    },
  });

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: "Journal Reminders",
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#6C63FF",
    });
  }

  return status;
}

export async function cancelAllScheduled(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export function addResponseListener(
  handler: (response: Notifications.NotificationResponse) => void,
): Notifications.EventSubscription {
  return Notifications.addNotificationResponseReceivedListener(handler);
}

export function getLastResponseAsync(): Promise<Notifications.NotificationResponse | null> {
  return Notifications.getLastNotificationResponseAsync();
}

export function isWithinQuietHours(
  hour: number,
  minute: number,
  quietStart: string | null,
  quietEnd: string | null,
): boolean {
  if (quietStart === null || quietEnd === null) {
    return false;
  }

  const [startH, startM] = parseTimeString(quietStart);
  const [endH, endM] = parseTimeString(quietEnd);

  const current = hour * 60 + minute;
  const start = startH * 60 + startM;
  const end = endH * 60 + endM;

  if (start <= end) {
    return current >= start && current < end;
  }

  return current >= start || current < end;
}

function parseTimeString(time: string): [number, number] {
  const parts = time.split(":");
  return [parseInt(parts[0], 10), parseInt(parts[1], 10)];
}

function toExpoWeekday(backendDay: number): number {
  return backendDay + 1;
}

export async function scheduleReminders(prefs: SchedulablePreferences): Promise<number> {
  await cancelAllScheduled();

  const { reminderTimes, activeDays, quietHoursStart, quietHoursEnd } = prefs;

  if (reminderTimes.length === 0 || activeDays.length === 0) {
    return 0;
  }

  let scheduled = 0;

  for (const time of reminderTimes) {
    if (isWithinQuietHours(time.hour, time.minute, quietHoursStart, quietHoursEnd)) {
      continue;
    }

    for (const day of activeDays) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: NOTIFICATION_TITLE,
          body: getRandomNudgeMessage(),
          data: { action: "check_in" },
          ...(Platform.OS === "android" ? { channelId: ANDROID_CHANNEL_ID } : {}),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: toExpoWeekday(day),
          hour: time.hour,
          minute: time.minute,
        },
      });
      scheduled++;
    }
  }

  return scheduled;
}
