import { StyleSheet } from "react-native";

import { spacing } from "@/styles";

export const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.md,
    gap: spacing.lg,
  },
  centeredContent: {
    justifyContent: "center",
  },
  loadingContainer: {
    gap: spacing.md,
  },
});
