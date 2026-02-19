import { MapPin, X } from "lucide-react-native";
import { useCallback, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { AppText, Icon } from "@/components/ui";
import { useTheme } from "@/hooks/useTheme";
import type { LocationData } from "@/lib/locationUtils";
import { spacing } from "@/styles";

import { LocationSearchSheet } from "./LocationSearchSheet";
import type { LocationPickerProps } from "./types";

export function LocationPicker({
  location,
  onLocationChange,
}: LocationPickerProps) {
  const { colors } = useTheme();
  const [sheetVisible, setSheetVisible] = useState(false);

  const handleOpen = useCallback(() => {
    setSheetVisible(true);
  }, []);

  const handleDismiss = useCallback(() => {
    setSheetVisible(false);
  }, []);

  const handleSelect = useCallback(
    (selected: LocationData) => {
      onLocationChange(selected);
      setSheetVisible(false);
    },
    [onLocationChange],
  );

  const handleClear = useCallback(() => {
    onLocationChange(null);
  }, [onLocationChange]);

  return (
    <>
      {location ? (
        <View style={styles.locationRow}>
          <Pressable
            onPress={handleOpen}
            style={styles.locationContent}
            accessibilityRole="button"
            accessibilityLabel="Change location"
          >
            <Icon icon={MapPin} size="xs" color={colors.accent} />
            <AppText
              variant="caption"
              color={colors.accent}
              numberOfLines={1}
              style={styles.locationText}
            >
              {location.displayName}
            </AppText>
          </Pressable>
          <Pressable
            onPress={handleClear}
            hitSlop={8}
            accessibilityLabel="Remove location"
          >
            <Icon icon={X} size="xs" color={colors.textTertiary} />
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={handleOpen}
          style={styles.trigger}
          accessibilityRole="button"
          accessibilityLabel="Add location"
        >
          <Icon icon={MapPin} size="xs" color={colors.textTertiary} />
          <AppText variant="caption" color={colors.textTertiary}>
            Add location
          </AppText>
        </Pressable>
      )}

      <LocationSearchSheet
        visible={sheetVisible}
        currentLocation={location}
        onSelect={handleSelect}
        onDismiss={handleDismiss}
      />
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: 2,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: 2,
  },
  locationContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    flexShrink: 1,
  },
  locationText: {
    flexShrink: 1,
  },
});
