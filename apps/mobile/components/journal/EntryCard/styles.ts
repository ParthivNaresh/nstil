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
  bodyRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  bodyText: {
    flex: 1,
    flexShrink: 1,
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
