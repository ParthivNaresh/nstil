export interface CreateJournalFormProps {
  readonly name: string;
  readonly nameError: string | undefined;
  readonly description: string;
  readonly color: string;
  readonly onNameChange: (value: string) => void;
  readonly onDescriptionChange: (value: string) => void;
  readonly onColorChange: (hex: string) => void;
}
