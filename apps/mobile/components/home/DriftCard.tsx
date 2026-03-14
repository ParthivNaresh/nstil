import { Waves } from "lucide-react-native";
import { useCallback } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import { AppText, Button, Card, Icon } from "@/components/ui";
import { useTheme } from "@/hooks/useTheme";
import { withAlpha } from "@/lib/colorUtils";
import { spacing } from "@/styles";

const FADE_DURATION = 250;

export function DriftCard() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();

  const handlePress = useCallback(() => {
    router.push("/drift");
  }, [router]);

  return (
    <Animated.View entering={FadeIn.duration(FADE_DURATION)}>
      <Card>
        <View style={styles.container}>
          <View style={styles.header}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: withAlpha(colors.accent, 0.12) },
              ]}
            >
              <Icon icon={Waves} size="sm" color={colors.accent} />
            </View>
            <AppText variant="label" color={colors.textPrimary}>
              {t("home.drift.title")}
            </AppText>
          </View>
          <AppText variant="bodySmall" color={colors.textSecondary}>
            {t("home.drift.subtitle")}
          </AppText>
          <View style={styles.action}>
            <Button
              title={t("home.drift.action")}
              onPress={handlePress}
              variant="secondary"
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  action: {
    marginTop: spacing.xs,
  },
});
