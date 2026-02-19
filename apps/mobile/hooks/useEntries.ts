import { queryKeys } from "@/lib/queryKeys";
import {
  createEntry,
  deleteEntry,
  getEntry,
  listEntries,
  searchEntries,
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

import { useGenerateReflection } from "./useEntryReflection";

const DEFAULT_PAGE_SIZE = 20;

function useInvalidateEntryQueries() {
  const queryClient = useQueryClient();

  return () => {
    void queryClient.invalidateQueries({
      queryKey: queryKeys.entries.lists(),
    });
    void queryClient.invalidateQueries({
      queryKey: queryKeys.entries.dayEntries(),
    });
    void queryClient.invalidateQueries({
      queryKey: queryKeys.entries.calendars(),
    });
  };
}

export function useEntries(journalId?: string) {
  return useInfiniteQuery<PaginatedResponse<JournalEntry>>({
    queryKey: queryKeys.entries.list(undefined, undefined, journalId),
    queryFn: ({ pageParam }) =>
      listEntries({
        cursor: pageParam as string | undefined,
        limit: DEFAULT_PAGE_SIZE,
        journalId,
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
  const invalidate = useInvalidateEntryQueries();
  const generateReflection = useGenerateReflection();

  return useMutation<JournalEntry, Error, JournalEntryCreate>({
    mutationFn: createEntry,
    onSuccess: (createdEntry) => {
      invalidate();
      generateReflection.mutate(createdEntry);
    },
  });
}

export function useUpdateEntry() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateEntryQueries();
  const generateReflection = useGenerateReflection();

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
      invalidate();
      generateReflection.mutate(updatedEntry);
    },
  });
}

export function useTogglePin() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateEntryQueries();

  return useMutation<
    JournalEntry,
    Error,
    { id: string; isPinned: boolean }
  >({
    mutationFn: ({ id, isPinned }) =>
      updateEntry(id, { is_pinned: !isPinned }),
    onSuccess: (updatedEntry) => {
      queryClient.setQueryData(
        queryKeys.entries.detail(updatedEntry.id),
        updatedEntry,
      );
      invalidate();
    },
  });
}

export function useSearchEntries(query: string, journalId?: string) {
  const trimmed = query.trim();

  return useInfiniteQuery<PaginatedResponse<JournalEntry>>({
    queryKey: queryKeys.entries.search(trimmed, journalId),
    queryFn: ({ pageParam }) =>
      searchEntries({
        query: trimmed,
        cursor: pageParam as string | undefined,
        limit: DEFAULT_PAGE_SIZE,
        journalId,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? lastPage.next_cursor : undefined,
    enabled: trimmed.length > 0,
  });
}

export function useDeleteEntry() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateEntryQueries();

  return useMutation<void, Error, string>({
    mutationFn: deleteEntry,
    onSuccess: (_data, deletedId) => {
      queryClient.removeQueries({
        queryKey: queryKeys.entries.detail(deletedId),
      });
      invalidate();
    },
  });
}
