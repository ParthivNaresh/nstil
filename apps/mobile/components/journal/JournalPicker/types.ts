import type { JournalSpace } from "@/types";

export interface JournalPickerProps {
  readonly journals: JournalSpace[];
  readonly selectedId: string;
  readonly onSelect: (id: string) => void;
}

export interface JournalPickerItemProps {
  readonly journal: JournalSpace;
  readonly isSelected: boolean;
  readonly onPress: (id: string) => void;
}
