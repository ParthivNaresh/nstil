import type { JournalEntry } from "@/types";

export interface EntryCardProps {
  readonly entry: JournalEntry;
  readonly onPress: (id: string) => void;
}

export interface EntryCardSkeletonProps {
  readonly testID?: string;
}
