export type BadgeMode = "count" | "dot";

export interface BadgeProps {
  mode?: BadgeMode;
  count?: number;
  color?: string;
  positioned?: boolean;
  testID?: string;
}
