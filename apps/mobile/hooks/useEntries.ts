import { queryKeys } from "@/lib/queryKeys";
import {
  createEntry,
  deleteEntry,
  getEntry,
  listEntries,
  updateEntry,
} from "@/services/api/entries";
import type {
  JournalEntry,
  JournalEntryCreate,
  JournalEntryUpdate,
  PaginatedResponse,
} from "@/types";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

const DEFAULT_PAGE_SIZE = 20;

export function useEntries() {
  return useInfiniteQuery<PaginatedResponse<JournalEntry>>({
    queryKey: queryKeys.entries.lists(),
    queryFn: ({ pageParam }) =>
      listEntries({
        cursor: pageParam as string | undefined,
        limit: DEFAULT_PAGE_SIZE,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? lastPage.next_cursor : undefined,
  });
}

export function useEntry(id: string) {
  return useQuery<JournalEntry>({
    queryKey: queryKeys.entries.detail(id),
    queryFn: () => getEntry(id),
    enabled: !!id,
  });
}

export function useCreateEntry() {
  const queryClient = useQueryClient();

  return useMutation<JournalEntry, Error, JournalEntryCreate>({
    mutationFn: createEntry,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.entries.lists(),
      });
    },
  });
}

export function useUpdateEntry() {
  const queryClient = useQueryClient();

  return useMutation<
    JournalEntry,
    Error,
    { id: string; data: JournalEntryUpdate }
  >({
    mutationFn: ({ id, data }) => updateEntry(id, data),
    onSuccess: (updatedEntry) => {
      queryClient.setQueryData(
        queryKeys.entries.detail(updatedEntry.id),
        updatedEntry,
      );
      void queryClient.invalidateQueries({
        queryKey: queryKeys.entries.lists(),
      });
    },
  });
}

export function useDeleteEntry() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: deleteEntry,
    onSuccess: (_data, deletedId) => {
      queryClient.removeQueries({
        queryKey: queryKeys.entries.detail(deletedId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.entries.lists(),
      });
    },
  });
}
