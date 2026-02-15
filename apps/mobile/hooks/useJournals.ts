import { queryKeys } from "@/lib/queryKeys";
import {
  createJournal,
  deleteJournal,
  getJournal,
  listJournals,
  updateJournal,
} from "@/services/api/journals";
import type {
  JournalSpace,
  JournalSpaceCreate,
  JournalSpaceListResponse,
  JournalSpaceUpdate,
} from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useJournals() {
  return useQuery<JournalSpaceListResponse, Error, JournalSpace[]>({
    queryKey: queryKeys.journals.lists(),
    queryFn: listJournals,
    select: (data) => data.items,
  });
}

export function useJournal(id: string) {
  return useQuery<JournalSpace>({
    queryKey: queryKeys.journals.detail(id),
    queryFn: () => getJournal(id),
    enabled: !!id,
  });
}

export function useCreateJournal() {
  const queryClient = useQueryClient();

  return useMutation<JournalSpace, Error, JournalSpaceCreate>({
    mutationFn: createJournal,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.journals.lists(),
      });
    },
  });
}

export function useUpdateJournal() {
  const queryClient = useQueryClient();

  return useMutation<
    JournalSpace,
    Error,
    { id: string; data: JournalSpaceUpdate }
  >({
    mutationFn: ({ id, data }) => updateJournal(id, data),
    onSuccess: (updatedJournal) => {
      queryClient.setQueryData(
        queryKeys.journals.detail(updatedJournal.id),
        updatedJournal,
      );
      void queryClient.invalidateQueries({
        queryKey: queryKeys.journals.lists(),
      });
    },
  });
}

export function useDeleteJournal() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: deleteJournal,
    onSuccess: (_data, deletedId) => {
      queryClient.removeQueries({
        queryKey: queryKeys.journals.detail(deletedId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.journals.lists(),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.entries.lists(),
      });
    },
  });
}
