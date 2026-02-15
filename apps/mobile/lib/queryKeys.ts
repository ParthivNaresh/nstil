export const queryKeys = {
  entries: {
    all: ["entries"] as const,
    lists: () => [...queryKeys.entries.all, "list"] as const,
    list: (cursor?: string, limit?: number, journalId?: string) =>
      [...queryKeys.entries.lists(), { cursor, limit, journalId }] as const,
    details: () => [...queryKeys.entries.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.entries.details(), id] as const,
    searches: () => [...queryKeys.entries.all, "search"] as const,
    search: (query: string, journalId?: string) =>
      [...queryKeys.entries.searches(), { query, journalId }] as const,
  },
  journals: {
    all: ["journals"] as const,
    lists: () => [...queryKeys.journals.all, "list"] as const,
    details: () => [...queryKeys.journals.all, "detail"] as const,
    detail: (id: string) =>
      [...queryKeys.journals.details(), id] as const,
  },
} as const;
