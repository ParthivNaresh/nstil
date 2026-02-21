import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/queryKeys";
import {
  completeOnboarding,
  getProfile,
  updateProfile,
} from "@/services/api/profile";
import type { Profile, ProfileUpdate } from "@/types";

interface UseProfileOptions {
  readonly enabled?: boolean;
}

export function useProfile({ enabled = true }: UseProfileOptions = {}) {
  return useQuery<Profile>({
    queryKey: queryKeys.profile.all,
    queryFn: getProfile,
    enabled,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation<Profile, Error, ProfileUpdate>({
    mutationFn: updateProfile,
    onMutate: async (update) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.profile.all });

      const previous = queryClient.getQueryData<Profile>(
        queryKeys.profile.all,
      );

      if (previous) {
        queryClient.setQueryData<Profile>(queryKeys.profile.all, {
          ...previous,
          ...update,
          updated_at: new Date().toISOString(),
        });
      }

      return { previous };
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.profile.all, updated);
    },
    onError: (_error, _variables, context) => {
      const ctx = context as { previous?: Profile } | undefined;
      if (ctx?.previous) {
        queryClient.setQueryData(queryKeys.profile.all, ctx.previous);
      }
    },
  });
}

export function useCompleteOnboarding() {
  const queryClient = useQueryClient();

  return useMutation<Profile, Error, void>({
    mutationFn: completeOnboarding,
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.profile.all, updated);
    },
  });
}
