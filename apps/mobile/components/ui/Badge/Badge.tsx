import { useMemo } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { colors, radius } from "@/styles";

import type { BadgeProps } from "./types";

const DOT_SIZE = 8;
const COUNT_MIN_SIZE = 18;
const COUNT_PADDING = 4;

export function Badge({
  mode = "count",
  count = 0,
  color = colors.error,
  positioned = false,
  testID,
}: BadgeProps) {
  const displayCount = count > 99 ? "99+" : String(count);

  const positionStyle = useMemo<ViewStyle | undefined>(
    () =>
      positioned
        ? { position: "absolute", top: -4, right: -4 }
        : undefined,
    [positioned],
  );

  if (mode === "dot") {
    return (
      <View
        style={[styles.dot, { backgroundColor: color }, positionStyle]}
        testID={testID}
      />
    );
  }

  if (count <= 0) {
    return null;
  }

  return (
    <View
      style={[styles.count, { backgroundColor: color }, positionStyle]}
      testID={testID}
    >
      <AppText variant="caption" color={colors.textPrimary} style={styles.text}>
        {displayCount}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: radius.full,
  },
  count: {
    minWidth: COUNT_MIN_SIZE,
    height: COUNT_MIN_SIZE,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: COUNT_PADDING,
  },
  text: {
    fontSize: 10,
    fontWeight: "700",
    lineHeight: 12,
  },
});
