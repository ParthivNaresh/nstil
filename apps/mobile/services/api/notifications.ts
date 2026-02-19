import type {
  NotificationPreferences,
  NotificationPreferencesUpdate,
} from "@/types";

import { apiFetch } from "./client";

const NOTIFICATIONS_PATH = "/api/v1/ai/notifications";

export function getNotificationPreferences(): Promise<NotificationPreferences> {
  return apiFetch<NotificationPreferences>(NOTIFICATIONS_PATH);
}

export function updateNotificationPreferences(
  data: NotificationPreferencesUpdate,
): Promise<NotificationPreferences> {
  return apiFetch<NotificationPreferences>(NOTIFICATIONS_PATH, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}
