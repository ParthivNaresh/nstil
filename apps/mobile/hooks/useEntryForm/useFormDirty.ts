import { useMemo } from "react";

import type { LocationData } from "@/lib/locationUtils";
import type {
  EntryType,
  JournalEntry,
  LocalAudio,
  LocalImage,
  MoodCategory,
  MoodSpecific,
} from "@/types";

import type { InitialFormState } from "./types";

interface FormDirtyParams {
  readonly entry?: JournalEntry;
  readonly initial: InitialFormState;
  readonly body: string;
  readonly title: string;
  readonly moodCategory: MoodCategory | null;
  readonly moodSpecific: MoodSpecific | null;
  readonly tags: string[];
  readonly entryType: EntryType;
  readonly entryDate: Date;
  readonly journalId: string;
  readonly location: LocationData | null;
  readonly localImages: LocalImage[];
  readonly localAudio: LocalAudio | null;
  readonly removedMediaIds: ReadonlySet<string>;
}

function isLocationChanged(
  current: LocationData | null,
  entry?: JournalEntry,
): boolean {
  const initial =
    entry?.latitude != null && entry?.longitude != null
      ? {
          latitude: entry.latitude,
          longitude: entry.longitude,
          displayName: entry.location ?? "",
        }
      : null;

  if (current === null && initial === null) return false;
  if (current === null || initial === null) return true;

  return (
    current.latitude !== initial.latitude ||
    current.longitude !== initial.longitude ||
    current.displayName !== initial.displayName
  );
}

export function useFormDirty(params: FormDirtyParams): boolean {
  const {
    entry,
    initial,
    body,
    title,
    moodCategory,
    moodSpecific,
    tags,
    entryType,
    entryDate,
    journalId,
    location,
    localImages,
    localAudio,
    removedMediaIds,
  } = params;

  const isEditing = !!entry;

  return useMemo(() => {
    if (!isEditing) return true;

    if (localImages.length > 0 || localAudio !== null || removedMediaIds.size > 0) {
      return true;
    }

    if (body !== initial.body) return true;
    if (title !== initial.title) return true;
    if (moodCategory !== initial.moodCategory) return true;
    if (moodSpecific !== initial.moodSpecific) return true;
    if (entryType !== initial.entryType) return true;
    if (entryDate.getTime() !== initial.entryDate.getTime()) return true;
    if (journalId !== (entry?.journal_id ?? "")) return true;

    if (tags.length !== initial.tags.length) return true;
    if (tags.some((tag, i) => tag !== initial.tags[i])) return true;

    if (isLocationChanged(location, entry)) return true;

    return false;
  }, [
    isEditing,
    entry,
    initial,
    body,
    title,
    moodCategory,
    moodSpecific,
    tags,
    entryType,
    entryDate,
    journalId,
    location,
    localImages,
    localAudio,
    removedMediaIds,
  ]);
}
