import { StyleSheet } from "react-native";

import { spacing } from "@/styles";

export const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  list: {
    paddingHorizontal: spacing.md,
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    paddingVertical: spacing.xl,
  },
  separator: {
    height: spacing.md,
  },
});
