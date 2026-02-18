import { X } from "lucide-react-native";
import { useCallback } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import { AppText, Button, Card, Icon } from "@/components/ui";
import { useDismissPrompt, useEngagePrompt } from "@/hooks/useHomePrompt";
import { useTheme } from "@/hooks/useTheme";
import { withAlpha } from "@/lib/colorUtils";
import { getMoodGradient } from "@/lib/moodColors";
import { spacing } from "@/styles";
import type { AIPrompt } from "@/types";

interface CheckInCardProps {
  readonly prompt: AIPrompt;
}

const FADE_DURATION = 250;

export function CheckInCard({ prompt }: CheckInCardProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const { mutate: dismiss } = useDismissPrompt();
  const { mutate: engage } = useEngagePrompt();

  const gradient = getMoodGradient(prompt.mood_category);

  const handleCheckIn = useCallback(() => {
    engage(prompt.id);
    router.push("/check-in");
  }, [engage, prompt.id, router]);

  const handleDismiss = useCallback(() => {
    dismiss(prompt.id);
  }, [dismiss, prompt.id]);

  return (
    <Animated.View
      entering={FadeIn.duration(FADE_DURATION)}
      exiting={FadeOut.duration(FADE_DURATION)}
    >
      <Card>
        <View style={styles.container}>
          <View style={styles.header}>
            <View
              style={[
                styles.accent,
                { backgroundColor: withAlpha(gradient.from, 0.2) },
              ]}
            />
            <Pressable
              onPress={handleDismiss}
              hitSlop={12}
              style={styles.dismiss}
            >
              <Icon icon={X} size="sm" color={colors.textTertiary} />
            </Pressable>
          </View>

          <AppText variant="body" color={colors.textPrimary}>
            {prompt.content}
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  accent: {
    width: 32,
    height: 4,
    borderRadius: 2,
  },
  dismiss: {
    padding: spacing.xs,
  },
  action: {
    marginTop: spacing.xs,
  },
});
