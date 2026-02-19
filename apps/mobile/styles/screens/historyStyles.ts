import { StyleSheet } from "react-native";

import { spacing } from "@/styles";

export const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  listHeader: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  calendarWrapper: {
    paddingHorizontal: 0,
  },
  actionBarWrapper: {
    paddingTop: spacing.xs,
  },
  list: {
    paddingHorizontal: spacing.md,
  },
  emptyList: {
    flexGrow: 1,
  },
  cardWrapper: {
    marginBottom: spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    paddingVertical: spacing.xl,
  },
  separator: {
    height: spacing.md,
  },
  footer: {
    paddingVertical: spacing.lg,
    alignItems: "center",
  },
});
