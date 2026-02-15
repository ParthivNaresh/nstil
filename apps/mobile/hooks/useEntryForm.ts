import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";

import { useCreateEntry, useUpdateEntry } from "@/hooks/useEntries";
import type { MoodValue } from "@/components/ui/MoodSelector/types";
import type { EntryType, JournalEntry, JournalSpace } from "@/types";

const MAX_TAGS = 10;

interface EntryFormState {
  readonly title: string;
  readonly body: string;
  readonly moodScore: MoodValue | null;
  readonly tags: string[];
  readonly entryType: EntryType;
  readonly entryDate: Date;
}

interface UseEntryFormOptions {
  readonly entry?: JournalEntry;
  readonly journals?: JournalSpace[];
}

interface UseEntryFormReturn {
  readonly title: string;
  readonly body: string;
  readonly moodScore: MoodValue | null;
  readonly tags: string[];
  readonly entryType: EntryType;
  readonly entryDate: Date;
  readonly journalId: string;
  readonly bodyError: string | undefined;
  readonly isSubmitting: boolean;
  readonly canSubmit: boolean;
  readonly setTitle: (text: string) => void;
  readonly setBody: (text: string) => void;
  readonly setMoodScore: (mood: MoodValue) => void;
  readonly setEntryType: (type: EntryType) => void;
  readonly setEntryDate: (date: Date) => void;
  readonly setJournalId: (id: string) => void;
  readonly addTag: (tag: string) => void;
  readonly removeTag: (tag: string) => void;
  readonly handleSubmit: () => void;
  readonly maxTags: number;
}

function buildInitialState(entry?: JournalEntry): EntryFormState {
  if (!entry) {
    return {
      title: "",
      body: "",
      moodScore: null,
      tags: [],
      entryType: "journal",
      entryDate: new Date(),
    };
  }
  return {
    title: entry.title,
    body: entry.body,
    moodScore: entry.mood_score as MoodValue | null,
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
  const { entry, journals } = options;
  const router = useRouter();
  const createMutation = useCreateEntry();
  const updateMutation = useUpdateEntry();

  const initial = useMemo(() => buildInitialState(entry), [entry]);

  const [title, setTitle] = useState(initial.title);
  const [body, setBody] = useState(initial.body);
  const [moodScore, setMoodScore] = useState<MoodValue | null>(initial.moodScore);
  const [tags, setTags] = useState<string[]>(initial.tags);
  const [entryType, setEntryType] = useState<EntryType>(initial.entryType);
  const [entryDate, setEntryDate] = useState<Date>(initial.entryDate);
  const [journalId, setJournalId] = useState(() =>
    resolveInitialJournalId(entry, journals),
  );
  const [bodyError, setBodyError] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!journalId && journals && journals.length > 0) {
      setJournalId(journals[0].id);
    }
  }, [journalId, journals]);

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
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
    const dateIso = entryDate.toISOString();
    const onError = () => {
      Alert.alert("Unable to save", "Please check your connection and try again.");
    };

    if (entry) {
      updateMutation.mutate(
        {
          id: entry.id,
          data: {
            journal_id: journalId,
            body: trimmedBody,
            title: trimmedTitle || undefined,
            mood_score: moodScore ?? undefined,
            tags,
            entry_type: entryType,
            created_at: dateIso,
          },
        },
        { onSuccess: () => router.back(), onError },
      );
    } else {
      createMutation.mutate(
        {
          journal_id: journalId,
          body: trimmedBody,
          title: trimmedTitle || undefined,
          mood_score: moodScore ?? undefined,
          tags: tags.length > 0 ? tags : undefined,
          entry_type: entryType,
          created_at: dateIso,
        },
        { onSuccess: () => router.back(), onError },
      );
    }
  }, [body, title, moodScore, tags, entryType, entryDate, journalId, entry, createMutation, updateMutation, router]);

  return {
    title,
    body,
    moodScore,
    tags,
    entryType,
    entryDate,
    journalId,
    bodyError,
    isSubmitting,
    canSubmit,
    setTitle,
    setBody: handleBodyChange,
    setMoodScore,
    setEntryType,
    setEntryDate,
    setJournalId,
    addTag,
    removeTag,
    handleSubmit,
    maxTags: MAX_TAGS,
  };
}
