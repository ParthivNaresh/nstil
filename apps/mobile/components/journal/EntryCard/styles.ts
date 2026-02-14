import { StyleSheet } from "react-native";

import { radius, spacing } from "@/styles";

export const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
  },
  inner: {
    gap: spacing.sm,
  },
  innerWithAccent: {
    paddingLeft: spacing.sm,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  topLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  tagPill: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.xs,
  },
});
