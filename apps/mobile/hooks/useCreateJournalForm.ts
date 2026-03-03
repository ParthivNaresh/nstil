import { useRouter } from "expo-router";
import { useCallback, useState } from "react";

import { DEFAULT_JOURNAL_COLOR } from "@/lib/journalColors";

import { useCreateJournal } from "./useJournals";

const NAME_MAX_LENGTH = 100;
const DESCRIPTION_MAX_LENGTH = 500;

interface UseCreateJournalFormReturn {
  readonly name: string;
  readonly nameError: string | undefined;
  readonly description: string;
  readonly color: string;
  readonly isSubmitting: boolean;
  readonly canSubmit: boolean;
  readonly setName: (value: string) => void;
  readonly setDescription: (value: string) => void;
  readonly setColor: (hex: string) => void;
  readonly handleSubmit: () => void;
}

export function useCreateJournalForm(): UseCreateJournalFormReturn {
  const router = useRouter();
  const createJournal = useCreateJournal();

  const [name, setNameRaw] = useState("");
  const [nameError, setNameError] = useState<string | undefined>(undefined);
  const [description, setDescriptionRaw] = useState("");
  const [color, setColor] = useState(DEFAULT_JOURNAL_COLOR);

  const setName = useCallback((value: string) => {
    if (value.length <= NAME_MAX_LENGTH) {
      setNameRaw(value);
      setNameError(undefined);
    }
  }, []);

  const setDescription = useCallback((value: string) => {
    if (value.length <= DESCRIPTION_MAX_LENGTH) {
      setDescriptionRaw(value);
    }
  }, []);

  const trimmedName = name.trim();
  const canSubmit = trimmedName.length > 0 && !createJournal.isPending;

  const handleSubmit = useCallback(() => {
    if (!trimmedName) {
      setNameError("journal.create.nameRequired");
      return;
    }

    createJournal.mutate(
      {
        name: trimmedName,
        color,
        description: description.trim() || undefined,
      },
      {
        onSuccess: () => {
          router.back();
        },
      },
    );
  }, [trimmedName, color, description, createJournal, router]);

  return {
    name,
    nameError,
    description,
    color,
    isSubmitting: createJournal.isPending,
    canSubmit,
    setName,
    setDescription,
    setColor,
    handleSubmit,
  };
}
