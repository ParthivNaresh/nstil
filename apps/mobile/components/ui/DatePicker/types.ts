export type DatePickerMode = "date" | "time" | "datetime";

export interface DatePickerProps {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
  mode?: DatePickerMode;
  minimumDate?: Date;
  maximumDate?: Date;
  accessibilityLabel?: string;
  testID?: string;
}
