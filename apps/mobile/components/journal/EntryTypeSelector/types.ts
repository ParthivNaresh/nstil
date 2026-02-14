import type { EntryType } from "@/types";

export interface EntryTypeOption {
  readonly value: EntryType;
  readonly labelKey: string;
}

export interface EntryTypeSelectorProps {
  readonly value: EntryType;
  readonly onChange: (type: EntryType) => void;
  readonly label?: string;
}
