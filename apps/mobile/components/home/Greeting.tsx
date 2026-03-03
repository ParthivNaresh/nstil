import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppText } from "@/components/ui";
import { useTheme } from "@/hooks/useTheme";
import { getTimeOfDay } from "@/lib/greetingUtils";
import { spacing } from "@/styles";

interface GreetingProps {
  readonly displayName: string | null;
}

export function Greeting({ displayName }: GreetingProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const greetingText = useMemo(() => {
    const timeOfDay = getTimeOfDay();

    if (displayName) {
      return t(`home.greeting.${timeOfDay}Name`, { name: displayName });
    }

    return t(`home.greeting.${timeOfDay}`);
  }, [displayName, t]);

  return (
    <View style={styles.container}>
      <AppText variant="h2">{greetingText}</AppText>
      <AppText variant="bodySmall" color={colors.textTertiary}>
        {new Date().toLocaleDateString(undefined, {
          weekday: "long",
          month: "long",
          day: "numeric",
        })}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
});
