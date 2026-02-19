import { Link } from "expo-router";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { useTheme } from "@/hooks/useTheme";
import { spacing } from "@/styles";

import type { AuthFooterLinkProps } from "./types";

export function AuthFooterLink({ prompt, linkText, href }: AuthFooterLinkProps) {
  const { colors } = useTheme();

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
    gap: spacing.xs,
    marginTop: spacing.lg,
  },
  link: {
    fontWeight: "600",
  },
});
