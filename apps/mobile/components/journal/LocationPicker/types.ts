import type { LocationData } from "@/lib/locationUtils";

export interface LocationPickerProps {
  readonly location: LocationData | null;
  readonly onLocationChange: (location: LocationData | null) => void;
}
