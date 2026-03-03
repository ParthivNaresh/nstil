import { useCallback, useState } from "react";

import type { MoodCategory, MoodSpecific } from "@/types";

import { useCreateEntry } from "./useEntries";
import { useJournals } from "./useJournals";

interface MoodSnapshotRecord {
  readonly category: MoodCategory;
  readonly specific: MoodSpecific | null;
  readonly timestamp: Date;
}

interface UseMoodSnapshotReturn {
  readonly logMood: (category: MoodCategory, specific?: MoodSpecific) => void;
  readonly isLogging: boolean;
  readonly lastSnapshot: MoodSnapshotRecord | null;
}

export function useMoodSnapshot(): UseMoodSnapshotReturn {
  const { data: journals } = useJournals();
  const createEntry = useCreateEntry();
  const [lastSnapshot, setLastSnapshot] = useState<MoodSnapshotRecord | null>(null);

  const logMood = useCallback(
    (category: MoodCategory, specific?: MoodSpecific) => {
      const defaultJournal = journals?.[0];
      if (!defaultJournal) return;

      createEntry.mutate(
        {
          journal_id: defaultJournal.id,
          entry_type: "mood_snapshot",
          mood_category: category,
          mood_specific: specific,
        },
        {
          onSuccess: () => {
            setLastSnapshot({
              category,
              specific: specific ?? null,
              timestamp: new Date(),
            });
          },
        },
      );
    },
    [journals, createEntry],
  );

  return {
    logMood,
    isLogging: createEntry.isPending,
    lastSnapshot,
  };
}
