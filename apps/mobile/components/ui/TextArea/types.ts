export type TextAreaVariant = "outlined" | "flat";

export interface TextAreaProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  variant?: TextAreaVariant;
  maxLength?: number;
  showCount?: boolean;
  minHeight?: number;
  maxHeight?: number;
  placeholder?: string;
  accessibilityLabel?: string;
  testID?: string;
}
