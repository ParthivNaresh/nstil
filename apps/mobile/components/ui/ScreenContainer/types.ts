import type { ReactNode } from "react";

export interface ScreenContainerProps {
  children: ReactNode;
  scrollable?: boolean;
  centered?: boolean;
}
