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
    dayEntries: () => [...queryKeys.entries.all, "day"] as const,
    dayEntry: (date: string, journalId?: string) =>
      [...queryKeys.entries.dayEntries(), { date, journalId }] as const,
    calendars: () => [...queryKeys.entries.all, "calendar"] as const,
    calendar: (year: number, month: number, journalId?: string) =>
      [...queryKeys.entries.calendars(), { year, month, journalId }] as const,
    moodTrends: (days: number = 7) =>
      [...queryKeys.entries.all, "moodTrends", { days }] as const,
  },
  media: {
    all: ["media"] as const,
    lists: () => [...queryKeys.media.all, "list"] as const,
    list: (entryId: string) =>
      [...queryKeys.media.lists(), entryId] as const,
  },
  journals: {
    all: ["journals"] as const,
    lists: () => [...queryKeys.journals.all, "list"] as const,
    details: () => [...queryKeys.journals.all, "detail"] as const,
    detail: (id: string) =>
      [...queryKeys.journals.details(), id] as const,
  },
  notifications: {
    all: ["notifications"] as const,
    preferences: () => [...queryKeys.notifications.all, "preferences"] as const,
  },
  checkIn: {
    all: ["checkIn"] as const,
    active: () => [...queryKeys.checkIn.all, "active"] as const,
  },
  prompts: {
    all: ["prompts"] as const,
    lists: () => [...queryKeys.prompts.all, "list"] as const,
    list: (type?: string, status?: string) =>
      [...queryKeys.prompts.lists(), { type, status }] as const,
    generated: () => [...queryKeys.prompts.all, "generated"] as const,
    reflections: () => [...queryKeys.prompts.all, "reflection"] as const,
    reflection: (entryId: string) =>
      [...queryKeys.prompts.reflections(), entryId] as const,
  },
  insights: {
    all: ["insights"] as const,
    lists: () => [...queryKeys.insights.all, "list"] as const,
    list: (type?: string, status?: string) =>
      [...queryKeys.insights.lists(), { type, status }] as const,
    generated: () => [...queryKeys.insights.all, "generated"] as const,
  },
  profile: {
    all: ["profile"] as const,
  },
  aiProfile: {
    all: ["aiProfile"] as const,
  },
  ai: {
    all: ["ai"] as const,
    capabilities: () => [...queryKeys.ai.all, "capabilities"] as const,
    context: () => [...queryKeys.ai.all, "context"] as const,
  },
} as const;
