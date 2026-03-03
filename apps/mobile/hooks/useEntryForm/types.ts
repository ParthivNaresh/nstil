import type { CompressionProgress } from "@/hooks/useImagePicker";
import type { LocationData } from "@/lib/locationUtils";
import type {
  EntryMedia,
  EntryType,
  JournalEntry,
  JournalSpace,
  LocalAudio,
  LocalImage,
  MoodCategory,
  MoodSpecific,
} from "@/types";

export interface UseEntryFormOptions {
  readonly entry?: JournalEntry;
  readonly journals?: JournalSpace[];
  readonly initialDate?: Date;
  readonly existingMedia?: EntryMedia[];
}

export interface UseEntryFormReturn {
  readonly title: string;
  readonly body: string;
  readonly moodCategory: MoodCategory | null;
  readonly moodSpecific: MoodSpecific | null;
  readonly tags: string[];
  readonly entryType: EntryType;
  readonly entryDate: Date;
  readonly journalId: string;
  readonly location: LocationData | null;
  readonly bodyError: string | undefined;
  readonly isSubmitting: boolean;
  readonly canSubmit: boolean;
  readonly localImages: LocalImage[];
  readonly existingMedia: EntryMedia[];
  readonly removedMediaIds: ReadonlySet<string>;
  readonly maxImages: number;
  readonly compressionProgress: CompressionProgress | null;
  readonly localAudio: LocalAudio | null;
  readonly existingAudio: EntryMedia | null;
  readonly setTitle: (text: string) => void;
  readonly setBody: (text: string) => void;
  readonly setMoodCategory: (category: MoodCategory) => void;
  readonly setMoodSpecific: (specific: MoodSpecific) => void;
  readonly setEntryType: (type: EntryType) => void;
  readonly setEntryDate: (date: Date) => void;
  readonly setJournalId: (id: string) => void;
  readonly setLocation: (location: LocationData | null) => void;
  readonly addTag: (tag: string) => void;
  readonly removeTag: (tag: string) => void;
  readonly handlePickImages: () => void;
  readonly removeLocalImage: (localId: string) => void;
  readonly removeExistingMedia: (mediaId: string) => void;
  readonly isRecordingAudio: boolean;
  readonly startRecording: () => void;
  readonly stopRecording: () => void;
  readonly recordAudio: (audio: LocalAudio) => void;
  readonly removeAudio: () => void;
  readonly handleSubmit: () => void;
  readonly maxTags: number;
}

export interface InitialFormState {
  readonly title: string;
  readonly body: string;
  readonly moodCategory: MoodCategory | null;
  readonly moodSpecific: MoodSpecific | null;
  readonly tags: string[];
  readonly entryType: EntryType;
  readonly entryDate: Date;
}

export interface EntryMediaState {
  readonly localImages: LocalImage[];
  readonly existingMedia: EntryMedia[];
  readonly removedMediaIds: Set<string>;
  readonly compressionProgress: CompressionProgress | null;
  readonly localAudio: LocalAudio | null;
  readonly existingAudio: EntryMedia | null;
  readonly isRecordingAudio: boolean;
  readonly handlePickImages: () => void;
  readonly removeLocalImage: (localId: string) => void;
  readonly removeExistingMedia: (mediaId: string) => void;
  readonly startRecording: () => void;
  readonly stopRecording: () => void;
  readonly recordAudio: (audio: LocalAudio) => void;
  readonly removeAudio: () => void;
}
