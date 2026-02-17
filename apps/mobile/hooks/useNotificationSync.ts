import { useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";

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
      await syncSchedule(toSchedulablePreferences(prefs));
    } else {
      await clearScheduled();
    }
  } catch {
    // non-critical — will retry on next foreground
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
          await useNotificationStore
            .getState()
            .syncSchedule(toSchedulablePreferences(prefs));
        } else {
          await useNotificationStore.getState().clearScheduled();
        }
      } catch {
        // non-critical
      }
    }

    const subscription = AppState.addEventListener("change", handleAppStateChange);
    return () => subscription.remove();
  }, []);
}
