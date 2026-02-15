import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import { useQueryClient } from "@tanstack/react-query";

import { useCreateEntry, useUpdateEntry } from "@/hooks/useEntries";
import { useImagePicker } from "@/hooks/useImagePicker";
import { queryKeys } from "@/lib/queryKeys";
import { deleteMedia, uploadMedia } from "@/services/api/media";
import type {
  EntryMedia,
  EntryType,
  JournalEntry,
  JournalSpace,
  LocalImage,
  MoodCategory,
  MoodSpecific,
} from "@/types";

const MAX_TAGS = 10;
const MAX_IMAGES = 10;

interface UseEntryFormOptions {
  readonly entry?: JournalEntry;
  readonly journals?: JournalSpace[];
  readonly initialDate?: Date;
  readonly existingMedia?: EntryMedia[];
}

interface UseEntryFormReturn {
  readonly title: string;
  readonly body: string;
  readonly moodCategory: MoodCategory | null;
  readonly moodSpecific: MoodSpecific | null;
  readonly tags: string[];
  readonly entryType: EntryType;
  readonly entryDate: Date;
  readonly journalId: string;
  readonly bodyError: string | undefined;
  readonly isSubmitting: boolean;
  readonly canSubmit: boolean;
  readonly localImages: LocalImage[];
  readonly existingMedia: EntryMedia[];
  readonly removedMediaIds: ReadonlySet<string>;
  readonly maxImages: number;
  readonly setTitle: (text: string) => void;
  readonly setBody: (text: string) => void;
  readonly setMoodCategory: (category: MoodCategory) => void;
  readonly setMoodSpecific: (specific: MoodSpecific) => void;
  readonly setEntryType: (type: EntryType) => void;
  readonly setEntryDate: (date: Date) => void;
  readonly setJournalId: (id: string) => void;
  readonly addTag: (tag: string) => void;
  readonly removeTag: (tag: string) => void;
  readonly handlePickImages: () => void;
  readonly removeLocalImage: (localId: string) => void;
  readonly removeExistingMedia: (mediaId: string) => void;
  readonly handleSubmit: () => void;
  readonly maxTags: number;
}

interface InitialFormState {
  readonly title: string;
  readonly body: string;
  readonly moodCategory: MoodCategory | null;
  readonly moodSpecific: MoodSpecific | null;
  readonly tags: string[];
  readonly entryType: EntryType;
  readonly entryDate: Date;
}

function buildInitialState(entry?: JournalEntry, initialDate?: Date): InitialFormState {
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

function resolveInitialJournalId(
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

export function useEntryForm(options: UseEntryFormOptions = {}): UseEntryFormReturn {
  const { entry, journals, initialDate, existingMedia: initialMedia = [] } = options;
  const router = useRouter();
  const queryClient = useQueryClient();
  const createMutation = useCreateEntry();
  const updateMutation = useUpdateEntry();

  const initial = useMemo(() => buildInitialState(entry, initialDate), [entry, initialDate]);

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
  const [bodyError, setBodyError] = useState<string | undefined>(undefined);
  const [isUploading, setIsUploading] = useState(false);

  const [localImages, setLocalImages] = useState<LocalImage[]>([]);
  const [existingMedia] = useState<EntryMedia[]>(initialMedia);
  const [removedMediaIds, setRemovedMediaIds] = useState<Set<string>>(new Set());

  const visibleExistingCount = existingMedia.length - removedMediaIds.size;
  const totalImageCount = visibleExistingCount + localImages.length;

  const { pickImages } = useImagePicker({
    currentCount: totalImageCount,
    maxImages: MAX_IMAGES,
  });

  useEffect(() => {
    if (!journalId && journals && journals.length > 0) {
      setJournalId(journals[0].id);
    }
  }, [journalId, journals]);

  const isSubmitting = createMutation.isPending || updateMutation.isPending || isUploading;
  const canSubmit = !isSubmitting && !!journalId;

  const handleBodyChange = useCallback(
    (text: string) => {
      setBody(text);
      if (bodyError && text.trim()) {
        setBodyError(undefined);
      }
    },
    [bodyError],
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

  const handlePickImages = useCallback(async () => {
    const picked = await pickImages();
    if (picked.length > 0) {
      setLocalImages((prev) => [...prev, ...picked]);
    }
  }, [pickImages]);

  const removeLocalImage = useCallback((localId: string) => {
    setLocalImages((prev) => prev.filter((img) => img.localId !== localId));
  }, []);

  const removeExistingMedia = useCallback((mediaId: string) => {
    setRemovedMediaIds((prev) => new Set(prev).add(mediaId));
  }, []);

  const processMediaChanges = useCallback(
    async (entryId: string) => {
      const deletePromises = Array.from(removedMediaIds).map((mediaId) =>
        deleteMedia(entryId, mediaId).catch(() => undefined),
      );
      await Promise.all(deletePromises);

      for (const image of localImages) {
        await uploadMedia({
          entryId,
          uri: image.uri,
          fileName: image.fileName,
          contentType: image.contentType,
        });
      }
    },
    [localImages, removedMediaIds],
  );

  const invalidateAfterSave = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.entries.all });
    void queryClient.invalidateQueries({ queryKey: queryKeys.media.all });
  }, [queryClient]);

  const handleSubmit = useCallback(() => {
    const trimmedBody = body.trim();
    if (!trimmedBody) {
      setBodyError("journal.validation.bodyRequired");
      return;
    }

    const trimmedTitle = title.trim();
    const dateIso = entryDate.toISOString();
    const hasMediaChanges = localImages.length > 0 || removedMediaIds.size > 0;

    const onError = () => {
      Alert.alert("Unable to save", "Please check your connection and try again.");
    };

    const finishAndNavigateBack = async (entryId: string) => {
      if (hasMediaChanges) {
        setIsUploading(true);
        try {
          await processMediaChanges(entryId);
        } catch {
          Alert.alert("Media Error", "Some images may not have been saved.");
        } finally {
          setIsUploading(false);
        }
      }
      invalidateAfterSave();
      router.back();
    };

    if (entry) {
      updateMutation.mutate(
        {
          id: entry.id,
          data: {
            journal_id: journalId,
            body: trimmedBody,
            title: trimmedTitle || undefined,
            mood_category: moodCategory ?? undefined,
            mood_specific: moodSpecific ?? undefined,
            tags,
            entry_type: entryType,
            created_at: dateIso,
          },
        },
        {
          onSuccess: () => {
            void finishAndNavigateBack(entry.id);
          },
          onError,
        },
      );
    } else {
      createMutation.mutate(
        {
          journal_id: journalId,
          body: trimmedBody,
          title: trimmedTitle || undefined,
          mood_category: moodCategory ?? undefined,
          mood_specific: moodSpecific ?? undefined,
          tags: tags.length > 0 ? tags : undefined,
          entry_type: entryType,
          created_at: dateIso,
        },
        {
          onSuccess: (createdEntry) => {
            void finishAndNavigateBack(createdEntry.id);
          },
          onError,
        },
      );
    }
  }, [body, title, moodCategory, moodSpecific, tags, entryType, entryDate, journalId, entry, localImages, removedMediaIds, createMutation, updateMutation, router, processMediaChanges, invalidateAfterSave]);

  return {
    title,
    body,
    moodCategory,
    moodSpecific,
    tags,
    entryType,
    entryDate,
    journalId,
    bodyError,
    isSubmitting,
    canSubmit,
    localImages,
    existingMedia,
    removedMediaIds,
    maxImages: MAX_IMAGES,
    setTitle,
    setBody: handleBodyChange,
    setMoodCategory,
    setMoodSpecific,
    setEntryType,
    setEntryDate,
    setJournalId,
    addTag,
    removeTag,
    handlePickImages,
    removeLocalImage,
    removeExistingMedia,
    handleSubmit,
    maxTags: MAX_TAGS,
  };
}
