import { StyleSheet } from "react-native";

import { radius, spacing } from "@/styles";

const COLOR_DOT_SIZE = 8;

export const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: spacing.xs,
    gap: spacing.sm,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  colorDot: {
    width: COLOR_DOT_SIZE,
    height: COLOR_DOT_SIZE,
    borderRadius: COLOR_DOT_SIZE / 2,
  },
});
