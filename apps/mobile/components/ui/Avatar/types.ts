export type AvatarSize = "sm" | "md" | "lg" | "xl";

export interface AvatarProps {
  name?: string;
  email?: string;
  size?: AvatarSize;
  accessibilityLabel?: string;
  testID?: string;
}
