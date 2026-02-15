import type { EntryType, JournalSpace, MoodCategory, MoodSpecific } from "@/types";

export interface EntryFormProps {
  readonly journals: JournalSpace[];
  readonly journalId: string;
  readonly body: string;
  readonly title: string;
  readonly moodCategory: MoodCategory | null;
  readonly moodSpecific: MoodSpecific | null;
  readonly tags: string[];
  readonly entryType: EntryType;
  readonly entryDate: Date;
  readonly bodyError: string | undefined;
  readonly maxTags: number;
  readonly onJournalChange: (id: string) => void;
  readonly onBodyChange: (text: string) => void;
  readonly onTitleChange: (text: string) => void;
  readonly onMoodCategoryChange: (category: MoodCategory) => void;
  readonly onMoodSpecificChange: (specific: MoodSpecific) => void;
  readonly onEntryTypeChange: (type: EntryType) => void;
  readonly onDateChange: (date: Date) => void;
  readonly onAddTag: (tag: string) => void;
  readonly onRemoveTag: (tag: string) => void;
}
