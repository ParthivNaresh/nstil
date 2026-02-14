import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Alert } from "react-native";

import { useCreateEntry, useUpdateEntry } from "@/hooks/useEntries";
import type { MoodValue } from "@/components/ui/MoodSelector/types";
import type { EntryType, JournalEntry } from "@/types";

const MAX_TAGS = 10;

interface EntryFormState {
  readonly body: string;
  readonly title: string;
  readonly moodScore: MoodValue | null;
  readonly tags: string[];
  readonly entryType: EntryType;
}

interface UseEntryFormReturn {
  readonly body: string;
  readonly title: string;
  readonly moodScore: MoodValue | null;
  readonly tags: string[];
  readonly entryType: EntryType;
  readonly bodyError: string | undefined;
  readonly isSubmitting: boolean;
  readonly canSubmit: boolean;
  readonly setBody: (text: string) => void;
  readonly setTitle: (text: string) => void;
  readonly setMoodScore: (mood: MoodValue) => void;
  readonly setEntryType: (type: EntryType) => void;
  readonly addTag: (tag: string) => void;
  readonly removeTag: (tag: string) => void;
  readonly handleSubmit: () => void;
  readonly maxTags: number;
}

function buildInitialState(entry?: JournalEntry): EntryFormState {
  if (!entry) {
    return {
      body: "",
      title: "",
      moodScore: null,
      tags: [],
      entryType: "journal",
    };
  }
  return {
    body: entry.body,
    title: entry.title,
    moodScore: entry.mood_score as MoodValue | null,
    tags: [...entry.tags],
    entryType: entry.entry_type,
  };
}

export function useEntryForm(entry?: JournalEntry): UseEntryFormReturn {
  const router = useRouter();
  const createMutation = useCreateEntry();
  const updateMutation = useUpdateEntry();

  const initial = useMemo(() => buildInitialState(entry), [entry]);

  const [body, setBody] = useState(initial.body);
  const [title, setTitle] = useState(initial.title);
  const [moodScore, setMoodScore] = useState<MoodValue | null>(initial.moodScore);
  const [tags, setTags] = useState<string[]>(initial.tags);
  const [entryType, setEntryType] = useState<EntryType>(initial.entryType);
  const [bodyError, setBodyError] = useState<string | undefined>(undefined);

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const canSubmit = body.trim().length > 0 && !isSubmitting;

  const handleSetBody = useCallback((text: string) => {
    setBody(text);
    setBodyError(undefined);
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

  const handleSubmit = useCallback(() => {
    const trimmedBody = body.trim();
    if (!trimmedBody) {
      setBodyError("journal.validation.bodyRequired");
      return;
    }

    const trimmedTitle = title.trim();
    const onError = () => {
      Alert.alert("Unable to save", "Please check your connection and try again.");
    };

    if (entry) {
      updateMutation.mutate(
        {
          id: entry.id,
          data: {
            body: trimmedBody,
            title: trimmedTitle || undefined,
            mood_score: moodScore ?? undefined,
            tags,
            entry_type: entryType,
          },
        },
        { onSuccess: () => router.back(), onError },
      );
    } else {
      createMutation.mutate(
        {
          body: trimmedBody,
          title: trimmedTitle || undefined,
          mood_score: moodScore ?? undefined,
          tags: tags.length > 0 ? tags : undefined,
          entry_type: entryType,
        },
        { onSuccess: () => router.back(), onError },
      );
    }
  }, [body, title, moodScore, tags, entryType, entry, createMutation, updateMutation, router]);

  return {
    body,
    title,
    moodScore,
    tags,
    entryType,
    bodyError,
    isSubmitting,
    canSubmit,
    setBody: handleSetBody,
    setTitle,
    setMoodScore,
    setEntryType,
    addTag,
    removeTag,
    handleSubmit,
    maxTags: MAX_TAGS,
  };
}
