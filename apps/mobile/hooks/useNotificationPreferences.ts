import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { tryGeneratePersonalizedTexts } from "@/lib/ai/personalizedNotifications";
import { queryKeys } from "@/lib/queryKeys";
import type { SchedulablePreferences } from "@/lib/notifications";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from "@/services/api/notifications";
import { useNotificationStore } from "@/stores/notificationStore";
import type {
  NotificationPreferences,
  NotificationPreferencesUpdate,
} from "@/types";

function toSchedulablePreferences(prefs: NotificationPreferences): SchedulablePreferences {
  return {
    reminderTimes: prefs.reminder_times,
    activeDays: prefs.active_days,
    quietHoursStart: prefs.quiet_hours_start,
    quietHoursEnd: prefs.quiet_hours_end,
  };
}

export function useNotificationPreferences() {
  return useQuery<NotificationPreferences>({
    queryKey: queryKeys.notifications.preferences(),
    queryFn: getNotificationPreferences,
  });
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();
  const syncSchedule = useNotificationStore((s) => s.syncSchedule);

  return useMutation<
    NotificationPreferences,
    Error,
    NotificationPreferencesUpdate
  >({
    mutationFn: updateNotificationPreferences,
    onMutate: async (update) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.notifications.preferences(),
      });

      const previous = queryClient.getQueryData<NotificationPreferences>(
        queryKeys.notifications.preferences(),
      );

      if (previous) {
        queryClient.setQueryData<NotificationPreferences>(
          queryKeys.notifications.preferences(),
          { ...previous, ...update },
        );
      }

      return { previous };
    },
    onSuccess: async (updated) => {
      queryClient.setQueryData(
        queryKeys.notifications.preferences(),
        updated,
      );

      if (updated.reminders_enabled) {
        const personalizedTexts = await tryGeneratePersonalizedTexts();
        await syncSchedule(toSchedulablePreferences(updated), personalizedTexts);
      } else {
        await useNotificationStore.getState().clearScheduled();
      }
    },
    onError: (_error, _variables, context) => {
      const ctx = context as { previous?: NotificationPreferences } | undefined;
      if (ctx?.previous) {
        queryClient.setQueryData(
          queryKeys.notifications.preferences(),
          ctx.previous,
        );
      }
    },
  });
}
