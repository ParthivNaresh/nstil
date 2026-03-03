import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/queryKeys";
import {
  createBreathingSession,
  getBreathingStats,
  listBreathingSessions,
  updateBreathingSession,
} from "@/services/api/breathing";
import type { PaginatedResponse } from "@/types";
import type {
  BreathingSession,
  BreathingSessionCreate,
  BreathingSessionUpdate,
  BreathingStats,
} from "@/types/breathing";

const STATS_STALE_TIME_MS = 5 * 60 * 1000;
const SESSIONS_STALE_TIME_MS = 2 * 60 * 1000;

export function useBreathingStats() {
  return useQuery<BreathingStats>({
    queryKey: queryKeys.breathing.stats(),
    queryFn: getBreathingStats,
    staleTime: STATS_STALE_TIME_MS,
  });
}

export function useBreathingSessions() {
  return useQuery<PaginatedResponse<BreathingSession>>({
    queryKey: queryKeys.breathing.sessions(),
    queryFn: () => listBreathingSessions({ limit: 20 }),
    staleTime: SESSIONS_STALE_TIME_MS,
  });
}

export function useCreateBreathingSession() {
  const queryClient = useQueryClient();

  return useMutation<BreathingSession, Error, BreathingSessionCreate>({
    mutationFn: createBreathingSession,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.breathing.all });
    },
  });
}

export function useUpdateBreathingSession() {
  const queryClient = useQueryClient();

  return useMutation<
    BreathingSession,
    Error,
    { id: string; data: BreathingSessionUpdate }
  >({
    mutationFn: ({ id, data }) => updateBreathingSession(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.breathing.all });
    },
  });
}
