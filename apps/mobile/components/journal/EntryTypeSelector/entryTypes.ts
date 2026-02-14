import type { EntryTypeOption } from "./types";

export const ENTRY_TYPE_OPTIONS: readonly EntryTypeOption[] = [
  { value: "journal", labelKey: "journal.entryTypes.journal" },
  { value: "reflection", labelKey: "journal.entryTypes.reflection" },
  { value: "gratitude", labelKey: "journal.entryTypes.gratitude" },
  { value: "freewrite", labelKey: "journal.entryTypes.freewrite" },
] as const;
