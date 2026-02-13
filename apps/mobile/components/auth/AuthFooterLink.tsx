import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { colors, spacing, typography } from "@/styles";

import type { AuthFooterLinkProps } from "./types";

export function AuthFooterLink({ prompt, linkText, href }: AuthFooterLinkProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.prompt}>{prompt}</Text>
      <Link href={href} asChild>
        <Text style={styles.link}>{linkText}</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.xs,
  },
  prompt: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  link: {
    ...typography.bodySmall,
    color: colors.accent,
    fontWeight: "600",
  },
});
