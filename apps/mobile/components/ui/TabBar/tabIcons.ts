import type { LucideIcon } from "lucide-react-native";
import { Clock, House, Lightbulb, Settings } from "lucide-react-native";

const TAB_ICON_MAP: Record<string, LucideIcon> = {
  index: House,
  history: Clock,
  insights: Lightbulb,
  settings: Settings,
};

export function getTabIcon(routeName: string): LucideIcon {
  return TAB_ICON_MAP[routeName] ?? House;
}
