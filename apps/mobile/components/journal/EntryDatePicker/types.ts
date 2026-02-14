export interface EntryDatePickerProps {
  readonly value: Date;
  readonly onChange: (date: Date) => void;
  readonly maximumDate?: Date;
}
