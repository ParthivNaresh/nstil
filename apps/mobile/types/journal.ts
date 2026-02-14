export type EntryType = "journal" | "reflection" | "gratitude" | "freewrite";

export interface JournalEntry {
  readonly id: string;
  readonly user_id: string;
  readonly title: string;
  readonly body: string;
  readonly mood_score: number | null;
  readonly tags: string[];
  readonly location: string | null;
  readonly entry_type: EntryType;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface JournalEntryCreate {
  readonly body: string;
  readonly title?: string;
  readonly mood_score?: number;
  readonly tags?: string[];
  readonly location?: string;
  readonly entry_type?: EntryType;
}

export interface JournalEntryUpdate {
  readonly title?: string;
  readonly body?: string;
  readonly mood_score?: number;
  readonly tags?: string[];
  readonly location?: string;
  readonly entry_type?: EntryType;
}
