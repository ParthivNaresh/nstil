import * as Location from "expo-location";
import { Alert, Linking, Platform } from "react-native";

export interface LocationData {
  readonly latitude: number;
  readonly longitude: number;
  readonly displayName: string;
}

export type LocationStatus = "idle" | "requesting" | "fetching" | "geocoding" | "denied" | "error";

function formatGeocodedAddress(addresses: Location.LocationGeocodedAddress[]): string {
  if (addresses.length === 0) return "Unknown Location";

  const addr = addresses[0];
  const parts: string[] = [];

  if (addr.name && addr.name !== addr.street) {
    parts.push(addr.name);
  }

  if (addr.city) {
    parts.push(addr.city);
  } else if (addr.subregion) {
    parts.push(addr.subregion);
  }

  if (addr.region && addr.region !== addr.city) {
    parts.push(addr.region);
  }

  if (parts.length === 0 && addr.country) {
    parts.push(addr.country);
  }

  return parts.length > 0 ? parts.join(", ") : "Unknown Location";
}

async function fetchLocation(): Promise<LocationData> {
  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  const { latitude, longitude } = position.coords;
  const addresses = await Location.reverseGeocodeAsync({ latitude, longitude });
  const displayName = formatGeocodedAddress(addresses);

  return { latitude, longitude, displayName };
}

export async function getCurrentLocation(): Promise<LocationData | null> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== Location.PermissionStatus.GRANTED) {
    Alert.alert(
      "Location Access",
      "Location permission is required to tag your entry. You can enable it in Settings.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Open Settings", onPress: () => void Linking.openSettings() },
      ],
    );
    return null;
  }

  return fetchLocation();
}

export async function getCurrentLocationSilent(): Promise<LocationData | null> {
  const { status } = await Location.getForegroundPermissionsAsync();
  if (status !== Location.PermissionStatus.GRANTED) {
    return null;
  }

  try {
    return await fetchLocation();
  } catch {
    return null;
  }
}

export async function openInMaps(latitude: number, longitude: number, label?: string): Promise<void> {
  const encodedLabel = label ? encodeURIComponent(label) : `${latitude},${longitude}`;

  if (Platform.OS === "ios") {
    const appleMapsUrl = `https://maps.apple.com/?q=${encodedLabel}&ll=${latitude},${longitude}`;
    const canOpen = await Linking.canOpenURL(appleMapsUrl);
    if (canOpen) {
      await Linking.openURL(appleMapsUrl);
      return;
    }
  }

  if (Platform.OS === "android") {
    const geoUrl = `geo:${latitude},${longitude}?q=${latitude},${longitude}(${encodedLabel})`;
    const canOpen = await Linking.canOpenURL(geoUrl);
    if (canOpen) {
      await Linking.openURL(geoUrl);
      return;
    }
  }

  await Linking.openURL(
    `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
  );
}
