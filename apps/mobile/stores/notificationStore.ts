import { create } from "zustand";

import {
  cancelAllScheduled,
  getPermissionStatus,
  type NotificationPermissionStatus,
  PermissionStatus,
  requestPermission as requestNotificationPermission,
  scheduleReminders,
  type SchedulablePreferences,
} from "@/lib/notifications";

interface NotificationState {
  readonly permissionStatus: NotificationPermissionStatus;
  readonly initialized: boolean;
  initialize: () => Promise<void>;
  requestPermission: () => Promise<NotificationPermissionStatus>;
  refreshPermissionStatus: () => Promise<void>;
  syncSchedule: (prefs: SchedulablePreferences) => Promise<void>;
  clearScheduled: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  permissionStatus: PermissionStatus.UNDETERMINED,
  initialized: false,

  initialize: async () => {
    const status = await getPermissionStatus();
    set({ permissionStatus: status, initialized: true });
  },

  requestPermission: async () => {
    const status = await requestNotificationPermission();
    set({ permissionStatus: status });
    return status;
  },

  refreshPermissionStatus: async () => {
    const status = await getPermissionStatus();
    set({ permissionStatus: status });
  },

  syncSchedule: async (prefs: SchedulablePreferences) => {
    const { permissionStatus } = get();
    if (permissionStatus !== PermissionStatus.GRANTED) {
      return;
    }
    await scheduleReminders(prefs);
  },

  clearScheduled: async () => {
    await cancelAllScheduled();
  },
}));
