import type { CompressionProgress } from "@/hooks/useImagePicker";
import type { LocationData } from "@/lib/locationUtils";
import type {
  EntryMedia,
  EntryType,
  JournalSpace,
  LocalImage,
  MoodCategory,
  MoodSpecific,
} from "@/types";

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
  readonly location: LocationData | null;
  readonly bodyError: string | undefined;
  readonly maxTags: number;
  readonly localImages: LocalImage[];
  readonly existingMedia: EntryMedia[];
  readonly removedMediaIds: ReadonlySet<string>;
  readonly maxImages: number;
  readonly compressionProgress: CompressionProgress | null;
  readonly onJournalChange: (id: string) => void;
  readonly onBodyChange: (text: string) => void;
  readonly onTitleChange: (text: string) => void;
  readonly onMoodCategoryChange: (category: MoodCategory) => void;
  readonly onMoodSpecificChange: (specific: MoodSpecific) => void;
  readonly onEntryTypeChange: (type: EntryType) => void;
  readonly onDateChange: (date: Date) => void;
  readonly onLocationChange: (location: LocationData | null) => void;
  readonly onAddTag: (tag: string) => void;
  readonly onRemoveTag: (tag: string) => void;
  readonly onPickImages: () => void;
  readonly onRemoveLocalImage: (localId: string) => void;
  readonly onRemoveExistingMedia: (mediaId: string) => void;
}
