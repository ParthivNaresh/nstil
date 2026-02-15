export type EntryType = "journal" | "reflection" | "gratitude" | "freewrite";

export interface JournalEntry {
  readonly id: string;
  readonly user_id: string;
  readonly journal_id: string;
  readonly title: string;
  readonly body: string;
  readonly mood_score: number | null;
  readonly tags: string[];
  readonly location: string | null;
  readonly entry_type: EntryType;
  readonly is_pinned: boolean;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface JournalEntryCreate {
  readonly journal_id: string;
  readonly body: string;
  readonly title?: string;
  readonly mood_score?: number;
  readonly tags?: string[];
  readonly location?: string;
  readonly entry_type?: EntryType;
  readonly is_pinned?: boolean;
  readonly created_at?: string;
}

export interface JournalEntryUpdate {
  readonly journal_id?: string;
  readonly title?: string;
  readonly body?: string;
  readonly mood_score?: number;
  readonly tags?: string[];
  readonly location?: string;
  readonly entry_type?: EntryType;
  readonly is_pinned?: boolean;
  readonly created_at?: string;
}
