import { StyleSheet } from "react-native";

import { radius, spacing } from "@/styles";

export const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    alignSelf: "flex-start",
  },
});
