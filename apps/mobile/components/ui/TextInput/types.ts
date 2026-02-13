import type { TextInput as RNTextInput } from "react-native";

export interface TextInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address" | "numeric";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  autoComplete?: "email" | "password" | "password-new" | "off";
  returnKeyType?: "done" | "next" | "go";
  onSubmitEditing?: () => void;
  inputRef?: React.RefObject<RNTextInput | null>;
  accessibilityLabel?: string;
  testID?: string;
}
