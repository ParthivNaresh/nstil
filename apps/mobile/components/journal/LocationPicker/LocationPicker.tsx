import { MapPin, X } from "lucide-react-native";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";

import { AppText, Icon } from "@/components/ui";
import { useTheme } from "@/hooks/useTheme";
import { getCurrentLocation } from "@/lib/locationUtils";
import { spacing } from "@/styles";

import type { LocationPickerProps } from "./types";

export function LocationPicker({
  location,
  onLocationChange,
}: LocationPickerProps) {
  const { colors } = useTheme();
  const [isFetching, setIsFetching] = useState(false);

  const handleFetch = useCallback(async () => {
    setIsFetching(true);
    try {
      const result = await getCurrentLocation();
      if (result) {
        onLocationChange(result);
      }
    } finally {
      setIsFetching(false);
    }
  }, [onLocationChange]);

  const handleClear = useCallback(() => {
    onLocationChange(null);
  }, [onLocationChange]);

  if (isFetching) {
    return (
      <View style={styles.trigger}>
        <ActivityIndicator size="small" color={colors.textTertiary} />
      </View>
    );
  }

  if (location) {
    return (
      <View style={styles.locationRow}>
        <Pressable
          onPress={handleFetch}
          style={styles.locationContent}
          accessibilityRole="button"
          accessibilityLabel="Update location"
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
    );
  }

  return (
    <Pressable
      onPress={handleFetch}
      style={styles.trigger}
      accessibilityRole="button"
      accessibilityLabel="Add location"
    >
      <Icon icon={MapPin} size="xs" color={colors.textTertiary} />
      <AppText variant="caption" color={colors.textTertiary}>
        Add location
      </AppText>
    </Pressable>
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
