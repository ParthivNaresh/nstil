import { StyleSheet } from "react-native";

import { spacing } from "@/styles";

export const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
  },
  deleteSection: {
    marginTop: spacing.xl,
  },
});
