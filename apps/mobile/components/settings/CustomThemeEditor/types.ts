import type { CustomThemeInput } from "@/lib/themeBuilder";

export type ColorFieldKey = keyof CustomThemeInput;

export interface ColorPickerSheetProps {
  readonly visible: boolean;
  readonly label: string;
  readonly currentColor: string;
  readonly onConfirm: (color: string) => void;
  readonly onCancel: () => void;
}

export interface ColorRowProps {
  readonly label: string;
  readonly color: string;
  readonly onPress: () => void;
}

export interface ColorSectionProps {
  readonly title: string;
  readonly children: React.ReactNode;
}

export interface CustomThemeEditorProps {
  readonly input: CustomThemeInput;
  readonly onInputChange: (key: ColorFieldKey, value: string) => void;
}
