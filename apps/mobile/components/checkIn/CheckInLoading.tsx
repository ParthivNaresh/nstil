import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppText } from "@/components/ui";
import { useTheme } from "@/hooks/useTheme";
import { spacing } from "@/styles";

interface CheckInLoadingProps {
  readonly error: string | null;
  readonly onRetry: () => void;
}

export function CheckInLoading({ error, onRetry }: CheckInLoadingProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  if (error) {
    return (
      <View style={styles.container}>
        <AppText variant="body" color={colors.error}>
          {error}
        </AppText>
        <AppText
          variant="label"
          color={colors.accent}
          onPress={onRetry}
        >
          {t("common.tryAgain")}
        </AppText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.accent} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.lg,
  },
});
