import { useCallback, useEffect, useMemo, useState } from "react";

import type { LocationData } from "@/lib/locationUtils";
import { getCurrentLocationSilent } from "@/lib/locationUtils";
import type { EntryType, MoodCategory, MoodSpecific } from "@/types";

import {
  MAX_IMAGES,
  MAX_TAGS,
  buildInitialLocation,
  buildInitialState,
  resolveInitialJournalId,
} from "./formUtils";
import type { UseEntryFormOptions, UseEntryFormReturn } from "./types";
import { useEntryMediaState } from "./useEntryMediaState";
import { useEntrySubmit } from "./useEntrySubmit";
import { useFormDirty } from "./useFormDirty";

export function useEntryForm(
  options: UseEntryFormOptions = {},
): UseEntryFormReturn {
  const { entry, journals, initialDate, existingMedia: initialMedia = [] } = options;

  const initial = useMemo(
    () => buildInitialState(entry, initialDate),
    [entry, initialDate],
  );

  const [title, setTitle] = useState(initial.title);
  const [body, setBody] = useState(initial.body);
  const [moodCategory, setMoodCategoryState] = useState<MoodCategory | null>(
    initial.moodCategory,
  );
  const [moodSpecific, setMoodSpecificState] = useState<MoodSpecific | null>(
    initial.moodSpecific,
  );
  const [tags, setTags] = useState<string[]>(initial.tags);
  const [entryType, setEntryType] = useState<EntryType>(initial.entryType);
  const [entryDate, setEntryDate] = useState<Date>(initial.entryDate);
  const [journalId, setJournalId] = useState(() =>
    resolveInitialJournalId(entry, journals),
  );
  const [location, setLocation] = useState<LocationData | null>(() =>
    buildInitialLocation(entry),
  );

  const media = useEntryMediaState(initialMedia);

  const formState = useMemo(
    () => ({
      body,
      title,
      moodCategory,
      moodSpecific,
      tags,
      entryType,
      entryDate,
      journalId,
      location,
      localImages: media.localImages,
      localAudio: media.localAudio,
      removedMediaIds: media.removedMediaIds,
    }),
    [
      body, title, moodCategory, moodSpecific, tags, entryType,
      entryDate, journalId, location, media.localImages,
      media.localAudio, media.removedMediaIds,
    ],
  );

  const { isSubmitting, bodyError, handleSubmit, setBodyError } =
    useEntrySubmit(entry, formState);

  const isDirty = useFormDirty({
    entry,
    initial,
    ...formState,
  });

  useEffect(() => {
    if (!journalId && journals && journals.length > 0) {
      setJournalId(journals[0].id);
    }
  }, [journalId, journals]);

  const isNewEntry = !entry;
  useEffect(() => {
    if (!isNewEntry) return;
    let cancelled = false;
    void getCurrentLocationSilent().then((result) => {
      if (!cancelled && result) {
        setLocation(result);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [isNewEntry]);

  const canSubmit = !isSubmitting && !!journalId && isDirty;

  const handleBodyChange = useCallback(
    (text: string) => {
      setBody(text);
      if (bodyError && text.trim()) {
        setBodyError(undefined);
      }
    },
    [bodyError, setBodyError],
  );

  const setMoodCategory = useCallback((category: MoodCategory) => {
    setMoodCategoryState((prev) => {
      if (prev !== category) {
        setMoodSpecificState(null);
      }
      return category;
    });
  }, []);

  const setMoodSpecific = useCallback((specific: MoodSpecific) => {
    setMoodSpecificState(specific);
  }, []);

  const addTag = useCallback((tag: string) => {
    setTags((prev) => {
      if (prev.length >= MAX_TAGS || prev.includes(tag)) return prev;
      return [...prev, tag];
    });
  }, []);

  const removeTag = useCallback((tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  }, []);

  return {
    title,
    body,
    moodCategory,
    moodSpecific,
    tags,
    entryType,
    entryDate,
    journalId,
    location,
    bodyError,
    isSubmitting,
    canSubmit,
    localImages: media.localImages,
    existingMedia: media.existingMedia,
    removedMediaIds: media.removedMediaIds,
    compressionProgress: media.compressionProgress,
    maxImages: MAX_IMAGES,
    setTitle,
    setBody: handleBodyChange,
    setMoodCategory,
    setMoodSpecific,
    setEntryType,
    setEntryDate,
    setJournalId,
    setLocation,
    addTag,
    removeTag,
    handlePickImages: media.handlePickImages,
    removeLocalImage: media.removeLocalImage,
    isRecordingAudio: media.isRecordingAudio,
    startRecording: media.startRecording,
    stopRecording: media.stopRecording,
    recordAudio: media.recordAudio,
    removeAudio: media.removeAudio,
    localAudio: media.localAudio,
    existingAudio: media.existingAudio,
    removeExistingMedia: media.removeExistingMedia,
    handleSubmit,
    maxTags: MAX_TAGS,
  };
}
