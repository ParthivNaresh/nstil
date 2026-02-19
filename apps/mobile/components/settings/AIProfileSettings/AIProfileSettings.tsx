import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useRef } from "react";
import { StyleSheet, Switch, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppText, Card } from "@/components/ui";
import { useTheme } from "@/hooks/useTheme";
import { useUpdateAIProfile } from "@/hooks/useAIProfile";
import { withAlpha } from "@/lib/colorUtils";
import { spacing } from "@/styles";
import type { AIProfile, AIProfileUpdate, PromptStyle } from "@/types";

import { GoalsList } from "./GoalsList";
import { PromptStylePicker } from "./PromptStylePicker";
import { TopicsToAvoid } from "./TopicsToAvoid";

interface AIProfileSettingsProps {
  readonly profile: AIProfile;
}

const DEBOUNCE_MS = 500;

export function AIProfileSettings({ profile }: AIProfileSettingsProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { mutate } = useUpdateAIProfile();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const debouncedUpdate = useCallback(
    (update: AIProfileUpdate) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        mutate(update);
      }, DEBOUNCE_MS);
    },
    [mutate],
  );

  const immediateUpdate = useCallback(
    (update: AIProfileUpdate) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      mutate(update);
    },
    [mutate],
  );

  const handleToggleAI = useCallback(
    (enabled: boolean) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      immediateUpdate({ ai_enabled: enabled });
    },
    [immediateUpdate],
  );

  const handleStyleChange = useCallback(
    (style: PromptStyle) => {
      immediateUpdate({ prompt_style: style });
    },
    [immediateUpdate],
  );

  const handleTopicsChange = useCallback(
    (topics: string[]) => {
      debouncedUpdate({ topics_to_avoid: topics });
    },
    [debouncedUpdate],
  );

  const handleGoalsChange = useCallback(
    (goals: Record<string, unknown>[]) => {
      debouncedUpdate({ goals });
    },
    [debouncedUpdate],
  );

  return (
    <View style={styles.container}>
      <Card>
        <View style={styles.toggleRow}>
          <View style={styles.toggleText}>
            <AppText variant="label">
              {t("settings.aiProfile.aiEnabled")}
            </AppText>
            <AppText variant="caption" color={colors.textTertiary}>
              {t("settings.aiProfile.aiEnabledSubtitle")}
            </AppText>
          </View>
          <Switch
            value={profile.ai_enabled}
            onValueChange={handleToggleAI}
            trackColor={{
              false: withAlpha(colors.textTertiary, 0.3),
              true: withAlpha(colors.accent, 0.4),
            }}
            thumbColor={profile.ai_enabled ? colors.accent : colors.textTertiary}
          />
        </View>
      </Card>

      {profile.ai_enabled ? (
        <>
          <Card>
            <PromptStylePicker
              value={profile.prompt_style}
              onChange={handleStyleChange}
            />
          </Card>

          <Card>
            <TopicsToAvoid
              topics={profile.topics_to_avoid}
              onChange={handleTopicsChange}
            />
          </Card>

          <Card>
            <GoalsList
              goals={profile.goals}
              onChange={handleGoalsChange}
            />
          </Card>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  toggleText: {
    flex: 1,
    gap: spacing.xs,
  },
});
