import * as Location from "expo-location";
import { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet } from "react-native";
import MapView, { Marker } from "react-native-maps";
import type { MapPressEvent, Region } from "react-native-maps";

import { useTheme } from "@/hooks/useTheme";
import { radius } from "@/styles";

import type { LocationMapProps } from "./types";

const DEFAULT_LATITUDE_DELTA = 0.01;
const DEFAULT_LONGITUDE_DELTA = 0.01;
const MAP_HEIGHT = 350;
const ANIMATE_DURATION = 500;

export function LocationMap({
  latitude,
  longitude,
  onLocationSelect,
}: LocationMapProps) {
  const { isDark } = useTheme();
  const mapRef = useRef<MapView>(null);
  const [markerCoord, setMarkerCoord] = useState({
    latitude,
    longitude,
  });

  useEffect(() => {
    setMarkerCoord({ latitude, longitude });
    mapRef.current?.animateToRegion(
      {
        latitude,
        longitude,
        latitudeDelta: DEFAULT_LATITUDE_DELTA,
        longitudeDelta: DEFAULT_LONGITUDE_DELTA,
      },
      ANIMATE_DURATION,
    );
  }, [latitude, longitude]);

  const handleMapPress = useCallback(
    async (event: MapPressEvent) => {
      const { latitude: lat, longitude: lng } = event.nativeEvent.coordinate;
      setMarkerCoord({ latitude: lat, longitude: lng });

      const addresses = await Location.reverseGeocodeAsync({
        latitude: lat,
        longitude: lng,
      });

      let displayName = "Dropped Pin";
      if (addresses.length > 0) {
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
        if (parts.length > 0) {
          displayName = parts.join(", ");
        }
      }

      onLocationSelect({
        latitude: lat,
        longitude: lng,
        displayName,
      });
    },
    [onLocationSelect],
  );

  const initialRegion: Region = {
    latitude,
    longitude,
    latitudeDelta: DEFAULT_LATITUDE_DELTA,
    longitudeDelta: DEFAULT_LONGITUDE_DELTA,
  };

  return (
    <MapView
      ref={mapRef}
      style={localStyles.map}
      initialRegion={initialRegion}
      userInterfaceStyle={isDark ? "dark" : "light"}
      onPress={handleMapPress}
      showsUserLocation
      showsMyLocationButton={false}
    >
      <Marker coordinate={markerCoord} />
    </MapView>
  );
}

const localStyles = StyleSheet.create({
  map: {
    height: MAP_HEIGHT,
    borderRadius: radius.md,
    overflow: "hidden",
  },
});
