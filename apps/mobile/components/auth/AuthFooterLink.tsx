import { Link } from "expo-router";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { colors, spacing } from "@/styles";

import type { AuthFooterLinkProps } from "./types";

export function AuthFooterLink({ prompt, linkText, href }: AuthFooterLinkProps) {
  return (
    <View style={styles.container}>
      <AppText variant="bodySmall" color={colors.textSecondary}>
        {prompt}
      </AppText>
      <Link href={href} asChild>
        <AppText variant="bodySmall" color={colors.accent} style={styles.link}>
          {linkText}
        </AppText>
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
  link: {
    fontWeight: "600",
  },
});
