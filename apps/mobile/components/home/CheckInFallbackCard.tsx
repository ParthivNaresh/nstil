import { useCallback } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import { AppText, Button, Card } from "@/components/ui";
import { useTheme } from "@/hooks/useTheme";
import { spacing } from "@/styles";

const FADE_DURATION = 250;

export function CheckInFallbackCard() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();

  const handleCheckIn = useCallback(() => {
    router.push("/check-in");
  }, [router]);

  return (
    <Animated.View entering={FadeIn.duration(FADE_DURATION)}>
      <Card>
        <View style={styles.container}>
          <AppText variant="body" color={colors.textPrimary}>
            {t("home.fallbackPrompt")}
          </AppText>
          <View style={styles.action}>
            <Button
              title={t("home.checkIn")}
              onPress={handleCheckIn}
            />
          </View>
        </View>
      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  action: {
    marginTop: spacing.xs,
  },
});
