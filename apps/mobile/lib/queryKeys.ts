export const queryKeys = {
  entries: {
    all: ["entries"] as const,
    lists: () => [...queryKeys.entries.all, "list"] as const,
    list: (cursor?: string, limit?: number) =>
      [...queryKeys.entries.lists(), { cursor, limit }] as const,
    details: () => [...queryKeys.entries.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.entries.details(), id] as const,
    searches: () => [...queryKeys.entries.all, "search"] as const,
    search: (query: string) =>
      [...queryKeys.entries.searches(), query] as const,
  },
} as const;
