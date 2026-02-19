import type { LucideIcon } from "lucide-react-native";

export type EmptyStateVariant = "default" | "subtle" | "minimal";

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  variant?: EmptyStateVariant;
}
