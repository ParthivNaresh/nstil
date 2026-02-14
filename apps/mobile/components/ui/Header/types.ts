import type { ReactNode } from "react";

export interface HeaderProps {
  title: string;
  onBack?: () => void;
  rightAction?: ReactNode;
  transparent?: boolean;
}

export interface HeaderActionProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}
