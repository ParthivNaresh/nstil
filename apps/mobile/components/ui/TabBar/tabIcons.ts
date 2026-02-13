import type { LucideIcon } from "lucide-react-native";
import { BookOpen, Lightbulb, Settings } from "lucide-react-native";

const TAB_ICON_MAP: Record<string, LucideIcon> = {
  index: BookOpen,
  insights: Lightbulb,
  settings: Settings,
};

export function getTabIcon(routeName: string): LucideIcon {
  return TAB_ICON_MAP[routeName] ?? BookOpen;
}
