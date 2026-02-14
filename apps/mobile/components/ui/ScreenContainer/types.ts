import type { ReactNode } from "react";

export interface ScreenContainerProps {
  readonly children: ReactNode;
  readonly scrollable?: boolean;
  readonly centered?: boolean;
  readonly ambient?: boolean;
}
