import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Alert } from "react-native";
import { useQueryClient } from "@tanstack/react-query";

import { useCreateEntry, useUpdateEntry } from "@/hooks/useEntries";
import type { LocationData } from "@/lib/locationUtils";
import { queryKeys } from "@/lib/queryKeys";
import { deleteMedia, uploadAudio, uploadMedia } from "@/services/api/media";
import type {
  EntryType,
  JournalEntry,
  LocalAudio,
  LocalImage,
  MoodCategory,
  MoodSpecific,
} from "@/types";

interface SubmitFormState {
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

interface UseEntrySubmitReturn {
  readonly isSubmitting: boolean;
  readonly bodyError: string | undefined;
  readonly handleSubmit: () => void;
  readonly setBodyError: (error: string | undefined) => void;
}

async function processMediaChanges(
  entryId: string,
  localImages: readonly LocalImage[],
  localAudio: LocalAudio | null,
  removedMediaIds: ReadonlySet<string>,
): Promise<void> {
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

  if (localAudio) {
    await uploadAudio({
      entryId,
      uri: localAudio.uri,
      fileName: localAudio.fileName,
      contentType: localAudio.contentType,
      durationMs: localAudio.durationMs,
      waveform: localAudio.waveform,
    });
  }
}

export function useEntrySubmit(
  entry: JournalEntry | undefined,
  formState: SubmitFormState,
): UseEntrySubmitReturn {
  const router = useRouter();
  const queryClient = useQueryClient();
  const createMutation = useCreateEntry();
  const updateMutation = useUpdateEntry();
  const [isUploading, setIsUploading] = useState(false);
  const [bodyError, setBodyError] = useState<string | undefined>(undefined);

  const isSubmitting =
    createMutation.isPending || updateMutation.isPending || isUploading;

  const invalidateAfterSave = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.entries.all });
    void queryClient.invalidateQueries({ queryKey: queryKeys.media.all });
  }, [queryClient]);

  const handleSubmit = useCallback(() => {
    const {
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
    } = formState;

    const trimmedBody = body.trim();
    if (!trimmedBody) {
      setBodyError("journal.validation.bodyRequired");
      return;
    }

    const trimmedTitle = title.trim();
    const dateIso = entryDate.toISOString();
    const hasMediaChanges =
      localImages.length > 0 || localAudio !== null || removedMediaIds.size > 0;

    const onError = () => {
      Alert.alert("Unable to save", "Please check your connection and try again.");
    };

    const finishAndNavigateBack = async (entryId: string) => {
      if (hasMediaChanges) {
        setIsUploading(true);
        try {
          await processMediaChanges(entryId, localImages, localAudio, removedMediaIds);
        } catch {
          Alert.alert("Media Error", "Some images may not have been saved.");
        } finally {
          setIsUploading(false);
        }
      }
      invalidateAfterSave();
      router.back();
    };

    const locationFields = location
      ? {
          location: location.displayName || undefined,
          latitude: location.latitude,
          longitude: location.longitude,
        }
      : {};

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
            ...locationFields,
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
          ...locationFields,
        },
        {
          onSuccess: (createdEntry) => {
            void finishAndNavigateBack(createdEntry.id);
          },
          onError,
        },
      );
    }
  }, [
    entry,
    formState,
    createMutation,
    updateMutation,
    router,
    invalidateAfterSave,
  ]);

  return {
    isSubmitting,
    bodyError,
    handleSubmit,
    setBodyError,
  };
}
