import { useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";

import { tryGeneratePersonalizedTexts } from "@/lib/ai/personalizedNotifications";
import { PermissionStatus, type SchedulablePreferences } from "@/lib/notifications";
import { queryKeys } from "@/lib/queryKeys";
import { queryClient } from "@/lib/queryClient";
import { getNotificationPreferences } from "@/services/api/notifications";
import { useAuthStore } from "@/stores/authStore";
import { useNotificationStore } from "@/stores/notificationStore";
import type { NotificationPreferences } from "@/types";

function toSchedulablePreferences(prefs: NotificationPreferences): SchedulablePreferences {
  return {
    reminderTimes: prefs.reminder_times,
    activeDays: prefs.active_days,
    quietHoursStart: prefs.quiet_hours_start,
    quietHoursEnd: prefs.quiet_hours_end,
  };
}

async function fetchAndSchedule(): Promise<void> {
  const { permissionStatus, syncSchedule, clearScheduled } =
    useNotificationStore.getState();

  if (permissionStatus !== PermissionStatus.GRANTED) {
    return;
  }

  try {
    const prefs = await getNotificationPreferences();

    queryClient.setQueryData(queryKeys.notifications.preferences(), prefs);

    if (prefs.reminders_enabled) {
      const personalizedTexts = await tryGeneratePersonalizedTexts();
      await syncSchedule(toSchedulablePreferences(prefs), personalizedTexts);
    } else {
      await clearScheduled();
    }
  } catch (err) {
    console.error("[notifications] fetchAndSchedule failed:", err);
  }
}

export function useNotificationSync(): void {
  const session = useAuthStore((s) => s.session);
  const lastSyncedAt = useRef<string | null>(null);
  const previousSessionRef = useRef<string | null>(null);

  useEffect(() => {
    const currentUserId = session?.user?.id ?? null;
    const previousUserId = previousSessionRef.current;
    previousSessionRef.current = currentUserId;

    if (currentUserId && currentUserId !== previousUserId) {
      lastSyncedAt.current = null;
      void fetchAndSchedule();
    }

    if (!currentUserId && previousUserId) {
      lastSyncedAt.current = null;
      void useNotificationStore.getState().clearScheduled();
    }
  }, [session]);

  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState !== "active") {
        return;
      }

      void useNotificationStore.getState().refreshPermissionStatus();

      const currentSession = useAuthStore.getState().session;
      if (!currentSession) {
        return;
      }

      void syncOnForeground();
    };

    async function syncOnForeground(): Promise<void> {
      const { permissionStatus } = useNotificationStore.getState();
      if (permissionStatus !== PermissionStatus.GRANTED) {
        return;
      }

      try {
        const prefs = await getNotificationPreferences();

        if (prefs.updated_at === lastSyncedAt.current) {
          return;
        }

        lastSyncedAt.current = prefs.updated_at;
        queryClient.setQueryData(queryKeys.notifications.preferences(), prefs);

        if (prefs.reminders_enabled) {
          const personalizedTexts = await tryGeneratePersonalizedTexts();
          await useNotificationStore
            .getState()
            .syncSchedule(toSchedulablePreferences(prefs), personalizedTexts);
        } else {
          await useNotificationStore.getState().clearScheduled();
        }
      } catch (err) {
        console.error("[notifications] syncOnForeground failed:", err);
      }
    }

    const subscription = AppState.addEventListener("change", handleAppStateChange);
    return () => subscription.remove();
  }, []);
}
