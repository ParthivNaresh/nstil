import type { MoodValue } from "@/components/ui/MoodSelector/types";
import type { EntryType } from "@/types";

export interface EntryFormProps {
  readonly body: string;
  readonly title: string;
  readonly moodScore: MoodValue | null;
  readonly tags: string[];
  readonly entryType: EntryType;
  readonly entryDate: Date;
  readonly bodyError: string | undefined;
  readonly maxTags: number;
  readonly onBodyChange: (text: string) => void;
  readonly onTitleChange: (text: string) => void;
  readonly onMoodChange: (mood: MoodValue) => void;
  readonly onEntryTypeChange: (type: EntryType) => void;
  readonly onDateChange: (date: Date) => void;
  readonly onAddTag: (tag: string) => void;
  readonly onRemoveTag: (tag: string) => void;
}
