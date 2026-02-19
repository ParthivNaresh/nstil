import { Check, MapPin, Navigation, X } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput as RNTextInput,
  View,
} from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { AppText, Icon } from "@/components/ui";
import { useTheme } from "@/hooks/useTheme";
import { withAlpha } from "@/lib/colorUtils";
import { getCurrentLocation } from "@/lib/locationUtils";
import type { LocationData } from "@/lib/locationUtils";
import { searchLocations, searchResultToLocationData } from "@/lib/locationSearch";
import type { LocationSearchResult } from "@/lib/locationSearch";
import { radius, spacing, typography } from "@/styles";

import type { LocationSearchSheetProps } from "./types";

const IS_IOS = Platform.OS === "ios";

let LocationMap: typeof import("./LocationMap").LocationMap | null = null;
if (IS_IOS) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  LocationMap = require("./LocationMap").LocationMap as typeof LocationMap;
}

const ENTER_DURATION = 280;
const EXIT_DURATION = 200;
const DEBOUNCE_MS = 400;
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const MODAL_MAX_WIDTH = 340;
const CARD_WIDTH = Math.min(SCREEN_WIDTH - spacing.lg * 2, MODAL_MAX_WIDTH);
const CARD_INITIAL_TRANSLATE_Y = 10;

const DEFAULT_LATITUDE = 37.7749;
const DEFAULT_LONGITUDE = -122.4194;

export function LocationSearchSheet({
  visible,
  currentLocation,
  onSelect,
  onDismiss,
}: LocationSearchSheetProps) {
  const { colors, keyboardAppearance } = useTheme();

  const [modalVisible, setModalVisible] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LocationSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isFetchingCurrent, setIsFetchingCurrent] = useState(false);
  const [pendingSelection, setPendingSelection] = useState<LocationData | null>(null);

  const progress = useSharedValue(0);
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<RNTextInput>(null);

  const prevVisibleRef = useRef(visible);

  const closeModal = useCallback(() => {
    setModalVisible(false);
    dismissRef.current();
  }, []);

  useEffect(() => {
    const wasVisible = prevVisibleRef.current;
    prevVisibleRef.current = visible;

    if (visible && !wasVisible) {
      setQuery("");
      setResults([]);
      setIsSearching(false);
      setIsFetchingCurrent(false);
      setPendingSelection(null);
      setModalVisible(true);

      progress.value = withTiming(1, {
        duration: ENTER_DURATION,
        easing: Easing.out(Easing.quad),
      });

      setTimeout(() => inputRef.current?.focus(), ENTER_DURATION + 50);
    } else if (!visible && wasVisible && modalVisible) {
      Keyboard.dismiss();
      progress.value = withTiming(
        0,
        { duration: EXIT_DURATION, easing: Easing.in(Easing.quad) },
        (finished) => {
          if (finished) {
            runOnJS(closeModal)();
          }
        },
      );
    }
  }, [visible, modalVisible, progress, closeModal]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: progress.value * 0.4,
  }));

  const cardStyle = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      opacity: p,
      transform: [
        { scale: 0.94 + 0.06 * p },
        { translateY: CARD_INITIAL_TRANSLATE_Y * (1 - p) },
      ],
    };
  });

  const handleQueryChange = useCallback((text: string) => {
    setQuery(text);

    if (timerRef.current) clearTimeout(timerRef.current);

    const trimmed = text.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    timerRef.current = setTimeout(() => {
      void searchLocations(trimmed)
        .then((searchResults) => {
          setResults(searchResults);
          setIsSearching(false);
        })
        .catch(() => {
          setResults([]);
          setIsSearching(false);
        });
    }, DEBOUNCE_MS);
  }, []);

  const applySelection = useCallback(
    (locationData: LocationData) => {
      Keyboard.dismiss();
      setQuery(locationData.displayName);
      setResults([]);
      if (IS_IOS) {
        setPendingSelection(locationData);
      } else {
        onSelect(locationData);
      }
    },
    [onSelect],
  );

  const handleSelectResult = useCallback(
    (result: LocationSearchResult) => {
      applySelection(searchResultToLocationData(result));
    },
    [applySelection],
  );

  const handleMapSelect = useCallback(
    (locationData: LocationData) => {
      setQuery(locationData.displayName);
      setResults([]);
      setPendingSelection(locationData);
    },
    [],
  );

  const handleUseCurrentLocation = useCallback(async () => {
    setIsFetchingCurrent(true);
    try {
      const result = await getCurrentLocation();
      if (result) {
        applySelection(result);
      }
    } finally {
      setIsFetchingCurrent(false);
    }
  }, [applySelection]);

  const handleConfirm = useCallback(() => {
    if (pendingSelection) {
      onSelect(pendingSelection);
    }
  }, [pendingSelection, onSelect]);

  const handleBackdropPress = useCallback(() => {
    Keyboard.dismiss();
    onDismiss();
  }, [onDismiss]);

  const renderResult = useCallback(
    ({ item }: { item: LocationSearchResult }) => (
      <Pressable
        onPress={() => handleSelectResult(item)}
        style={({ pressed }) => [
          localStyles.resultRow,
          pressed && { backgroundColor: withAlpha(colors.accent, 0.08) },
        ]}
      >
        <Icon icon={MapPin} size="sm" color={colors.textTertiary} />
        <View style={localStyles.resultText}>
          <AppText variant="body" numberOfLines={1}>
            {item.displayName}
          </AppText>
          {item.subtitle ? (
            <AppText variant="caption" color={colors.textTertiary} numberOfLines={1}>
              {item.subtitle}
            </AppText>
          ) : null}
        </View>
      </Pressable>
    ),
    [colors, handleSelectResult],
  );

  const keyExtractor = useCallback(
    (_item: LocationSearchResult, index: number) => `${index}`,
    [],
  );

  const mapLat = pendingSelection?.latitude ?? currentLocation?.latitude ?? DEFAULT_LATITUDE;
  const mapLng = pendingSelection?.longitude ?? currentLocation?.longitude ?? DEFAULT_LONGITUDE;

  return (
    <Modal
      visible={modalVisible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <View style={localStyles.overlay}>
        <Animated.View style={[localStyles.backdrop, backdropStyle]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={handleBackdropPress}
          />
        </Animated.View>

        <Animated.View
          style={[
            localStyles.card,
            {
              backgroundColor: colors.sheet,
              borderColor: colors.glassBorder,
            },
            cardStyle,
          ]}
        >
          <View style={localStyles.header}>
            <AppText variant="h3">Location</AppText>
            <Pressable
              onPress={onDismiss}
              hitSlop={8}
              accessibilityLabel="Close"
            >
              <Icon icon={X} size="sm" color={colors.textTertiary} />
            </Pressable>
          </View>

          <View
            style={[
              localStyles.searchContainer,
              { backgroundColor: colors.glass, borderColor: colors.glassBorder },
            ]}
          >
            <Icon icon={MapPin} size="sm" color={colors.textTertiary} />
            <RNTextInput
              ref={inputRef}
              style={[localStyles.searchInput, { color: colors.textPrimary }]}
              value={query}
              onChangeText={handleQueryChange}
              placeholder="Search for a place..."
              placeholderTextColor={colors.textTertiary}
              selectionColor={colors.accent}
              keyboardAppearance={keyboardAppearance}
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {query.length > 0 ? (
              <Pressable
                onPress={() => handleQueryChange("")}
                hitSlop={8}
                accessibilityLabel="Clear search"
              >
                <Icon icon={X} size="xs" color={colors.textTertiary} />
              </Pressable>
            ) : null}
          </View>

          <Pressable
            onPress={handleUseCurrentLocation}
            disabled={isFetchingCurrent}
            style={({ pressed }) => [
              localStyles.currentLocationRow,
              pressed && { backgroundColor: withAlpha(colors.accent, 0.08) },
            ]}
          >
            {isFetchingCurrent ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <Icon icon={Navigation} size="sm" color={colors.accent} />
            )}
            <AppText variant="body" color={colors.accent}>
              Use Current Location
            </AppText>
          </Pressable>

          <View style={[localStyles.divider, { backgroundColor: colors.border }]} />

          {isSearching ? (
            <View style={localStyles.centered}>
              <ActivityIndicator size="small" color={colors.textTertiary} />
            </View>
          ) : results.length > 0 ? (
            <FlatList
              data={results}
              renderItem={renderResult}
              keyExtractor={keyExtractor}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              style={localStyles.resultsList}
            />
          ) : query.trim().length >= 2 ? (
            <View style={localStyles.centered}>
              <AppText variant="caption" color={colors.textTertiary}>
                No results found
              </AppText>
            </View>
          ) : null}

          {IS_IOS && LocationMap ? (
            <>
              <View style={[localStyles.divider, { backgroundColor: colors.border }]} />
              <AppText variant="caption" color={colors.textTertiary}>
                Or tap the map to drop a pin
              </AppText>
              <LocationMap
                latitude={mapLat}
                longitude={mapLng}
                onLocationSelect={handleMapSelect}
              />
            </>
          ) : null}

          {pendingSelection ? (
            <View style={localStyles.selectionRow}>
              <View style={localStyles.selectionText}>
                <Icon icon={MapPin} size="xs" color={colors.accent} />
                <AppText
                  variant="caption"
                  color={colors.accent}
                  numberOfLines={1}
                  style={localStyles.selectionLabel}
                >
                  {pendingSelection.displayName}
                </AppText>
              </View>
              <Pressable
                onPress={handleConfirm}
                style={[
                  localStyles.confirmButton,
                  { backgroundColor: withAlpha(colors.accent, 0.15) },
                ]}
                accessibilityLabel="Confirm location"
              >
                <Icon icon={Check} size="sm" color={colors.accent} />
              </Pressable>
            </View>
          ) : null}
        </Animated.View>
      </View>
    </Modal>
  );
}

const CONFIRM_SIZE = 40;

const localStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 1)",
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: radius["2xl"],
    borderWidth: 1,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: radius.md,
    height: 44,
    paddingHorizontal: spacing.sm,
    gap: spacing.sm,
  },
  searchInput: {
    ...typography.body,
    flex: 1,
    height: "100%",
  },
  currentLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.sm,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: spacing.xs,
  },
  resultsList: {
    maxHeight: 150,
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.sm,
  },
  resultText: {
    flex: 1,
    gap: 2,
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
  },
  selectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  selectionText: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    flex: 1,
  },
  selectionLabel: {
    flexShrink: 1,
  },
  confirmButton: {
    width: CONFIRM_SIZE,
    height: CONFIRM_SIZE,
    borderRadius: CONFIRM_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
});
