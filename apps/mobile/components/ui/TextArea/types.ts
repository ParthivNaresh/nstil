export interface TextAreaProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  maxLength?: number;
  showCount?: boolean;
  minHeight?: number;
  maxHeight?: number;
  placeholder?: string;
  accessibilityLabel?: string;
  testID?: string;
}
