export interface TagInputProps {
  readonly tags: string[];
  readonly onAdd: (tag: string) => void;
  readonly onRemove: (tag: string) => void;
  readonly maxTags: number;
  readonly label?: string;
}
