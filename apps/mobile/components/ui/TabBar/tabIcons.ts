import type { LucideIcon } from "lucide-react-native";
import { Clock, House, Lightbulb, Plus, Settings } from "lucide-react-native";

const TAB_ICON_MAP: Record<string, LucideIcon> = {
  index: House,
  history: Clock,
  create: Plus,
  insights: Lightbulb,
  settings: Settings,
};

export const CREATE_ROUTE = "create";

export function getTabIcon(routeName: string): LucideIcon {
  return TAB_ICON_MAP[routeName] ?? House;
}
