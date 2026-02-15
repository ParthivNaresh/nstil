import { StyleSheet } from "react-native";

import { radius, spacing } from "@/styles";

const MOOD_DOT_SIZE = 6;

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
  moodBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 2,
  },
  moodDotContainer: {
    width: MOOD_DOT_SIZE,
    height: MOOD_DOT_SIZE,
  },
  moodDotCanvas: {
    width: MOOD_DOT_SIZE,
    height: MOOD_DOT_SIZE,
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
