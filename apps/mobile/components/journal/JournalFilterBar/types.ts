import type { JournalSpace } from "@/types";

export interface JournalFilterBarProps {
  readonly journals: JournalSpace[];
  readonly selectedId: string | null;
  readonly onSelect: (id: string | null) => void;
}
