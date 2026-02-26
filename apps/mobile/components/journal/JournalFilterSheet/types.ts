import type { JournalSpace } from "@/types";

export interface JournalFilterSheetProps {
  readonly visible: boolean;
  readonly journals: JournalSpace[];
  readonly selectedId: string | null;
  readonly onSelect: (id: string | null) => void;
  readonly onClose: () => void;
}

export interface JournalFilterRowProps {
  readonly journal: JournalSpace;
  readonly isSelected: boolean;
  readonly onPress: (id: string) => void;
}
