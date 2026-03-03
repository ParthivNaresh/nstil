import type { JournalSpace } from "@/types";

export interface JournalCardProps {
  readonly journal: JournalSpace;
  readonly onPress: (id: string) => void;
}
