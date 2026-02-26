import { StyleSheet } from "react-native";

import { spacing } from "@/styles";

const COLOR_DOT_SIZE = 12;

export const styles = StyleSheet.create({
  inner: {
    gap: spacing.xs,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  colorDot: {
    width: COLOR_DOT_SIZE,
    height: COLOR_DOT_SIZE,
    borderRadius: COLOR_DOT_SIZE / 2,
  },
  nameContainer: {
    flex: 1,
  },
});
