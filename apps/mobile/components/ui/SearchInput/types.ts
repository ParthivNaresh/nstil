export interface SearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSearch?: (query: string) => void;
  placeholder?: string;
  debounceMs?: number;
  autoFocus?: boolean;
  accessibilityLabel?: string;
  testID?: string;
}
