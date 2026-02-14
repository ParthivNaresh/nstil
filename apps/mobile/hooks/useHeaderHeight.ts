import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HEADER_ROW_HEIGHT } from "@/components/ui/Header";

const HEADER_BORDER = 1;

export function useHeaderHeight(): number {
  const insets = useSafeAreaInsets();
  return insets.top + HEADER_ROW_HEIGHT + HEADER_BORDER;
}
