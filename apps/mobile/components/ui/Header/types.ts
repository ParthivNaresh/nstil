import type { ReactNode } from "react";

export interface HeaderProps {
  title: string;
  onBack?: () => void;
  rightAction?: ReactNode;
  transparent?: boolean;
}
