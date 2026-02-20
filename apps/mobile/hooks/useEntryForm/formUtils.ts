import type { LocationData } from "@/lib/locationUtils";
import type { JournalEntry, JournalSpace } from "@/types";

import type { InitialFormState } from "./types";

export const MAX_TAGS = 10;
export const MAX_IMAGES = 10;

export function buildInitialState(
  entry?: JournalEntry,
  initialDate?: Date,
): InitialFormState {
  if (!entry) {
    return {
      title: "",
      body: "",
      moodCategory: null,
      moodSpecific: null,
      tags: [],
      entryType: "journal",
      entryDate: initialDate ?? new Date(),
    };
  }
  return {
    title: entry.title,
    body: entry.body,
    moodCategory: entry.mood_category,
    moodSpecific: entry.mood_specific,
    tags: [...entry.tags],
    entryType: entry.entry_type,
    entryDate: new Date(entry.created_at),
  };
}

export function resolveInitialJournalId(
  entry?: JournalEntry,
  journals?: JournalSpace[],
): string {
  if (entry) {
    return entry.journal_id;
  }
  if (journals && journals.length > 0) {
    return journals[0].id;
  }
  return "";
}

export function buildInitialLocation(entry?: JournalEntry): LocationData | null {
  if (!entry) return null;
  if (entry.latitude != null && entry.longitude != null) {
    return {
      latitude: entry.latitude,
      longitude: entry.longitude,
      displayName: entry.location ?? "",
    };
  }
  return null;
}
