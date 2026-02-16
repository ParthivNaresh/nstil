import type { MediaPreview } from "./media";

export type EntryType = "journal" | "reflection" | "gratitude" | "freewrite";

export type MoodCategory = "happy" | "calm" | "sad" | "anxious" | "angry";

export type MoodSpecific =
  | "joyful" | "grateful" | "excited" | "proud"
  | "peaceful" | "content" | "relaxed" | "hopeful"
  | "down" | "lonely" | "disappointed" | "nostalgic"
  | "stressed" | "worried" | "overwhelmed" | "restless"
  | "frustrated" | "irritated" | "hurt" | "resentful";

export interface JournalEntry {
  readonly id: string;
  readonly user_id: string;
  readonly journal_id: string;
  readonly title: string;
  readonly body: string;
  readonly mood_category: MoodCategory | null;
  readonly mood_specific: MoodSpecific | null;
  readonly tags: string[];
  readonly location: string | null;
  readonly latitude: number | null;
  readonly longitude: number | null;
  readonly entry_type: EntryType;
  readonly is_pinned: boolean;
  readonly media_preview: MediaPreview | null;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface JournalEntryCreate {
  readonly journal_id: string;
  readonly body: string;
  readonly title?: string;
  readonly mood_category?: MoodCategory;
  readonly mood_specific?: MoodSpecific;
  readonly tags?: string[];
  readonly location?: string;
  readonly latitude?: number;
  readonly longitude?: number;
  readonly entry_type?: EntryType;
  readonly is_pinned?: boolean;
  readonly created_at?: string;
}

export interface JournalEntryUpdate {
  readonly journal_id?: string;
  readonly title?: string;
  readonly body?: string;
  readonly mood_category?: MoodCategory;
  readonly mood_specific?: MoodSpecific;
  readonly tags?: string[];
  readonly location?: string;
  readonly latitude?: number;
  readonly longitude?: number;
  readonly entry_type?: EntryType;
  readonly is_pinned?: boolean;
  readonly created_at?: string;
}
