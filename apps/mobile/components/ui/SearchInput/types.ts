export interface SearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSearch?: (query: string) => void;
  placeholder?: string;
  debounceMs?: number;
  accessibilityLabel?: string;
  testID?: string;
}
