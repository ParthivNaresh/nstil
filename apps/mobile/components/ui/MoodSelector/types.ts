export type MoodValue = 1 | 2 | 3 | 4 | 5;

export interface MoodOption {
  value: MoodValue;
  emoji: string;
  label: string;
}

export interface MoodSelectorProps {
  value: MoodValue | null;
  onChange: (mood: MoodValue) => void;
  label?: string;
  accessibilityLabel?: string;
  testID?: string;
}
