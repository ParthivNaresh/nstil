import type { MoodCategory, MoodSpecific } from "@/types";

export interface MoodSelectorProps {
  readonly category: MoodCategory | null;
  readonly specific: MoodSpecific | null;
  readonly onCategoryChange: (category: MoodCategory) => void;
  readonly onSpecificChange: (specific: MoodSpecific) => void;
  readonly label?: string;
}
