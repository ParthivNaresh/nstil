import type { LocationData } from "@/lib/locationUtils";

export interface LocationPickerProps {
  readonly location: LocationData | null;
  readonly onLocationChange: (location: LocationData | null) => void;
}

export interface LocationSearchSheetProps {
  readonly visible: boolean;
  readonly currentLocation: LocationData | null;
  readonly onSelect: (location: LocationData) => void;
  readonly onDismiss: () => void;
}

export interface LocationMapProps {
  readonly latitude: number;
  readonly longitude: number;
  readonly onLocationSelect: (location: LocationData) => void;
}
