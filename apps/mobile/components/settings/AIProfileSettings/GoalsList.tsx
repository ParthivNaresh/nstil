import { Plus, Trash2 } from "lucide-react-native";
import { useCallback, useRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  TextInput as RNTextInput,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

import { AppText, Icon } from "@/components/ui";
import { useTheme } from "@/hooks/useTheme";
import { radius, spacing, typography } from "@/styles";

interface GoalsListProps {
  readonly goals: Record<string, unknown>[];
  readonly onChange: (goals: Record<string, unknown>[]) => void;
}

const MAX_GOALS = 10;

function getGoalText(goal: Record<string, unknown>): string {
  const text = goal.text;
  return typeof text === "string" ? text : "";
}

export function GoalsList({ goals, onChange }: GoalsListProps) {
  const { t } = useTranslation();
  const { colors, keyboardAppearance } = useTheme();
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<RNTextInput>(null);

  const handleAdd = useCallback(() => {
    const trimmed = inputValue.trim();
    if (!trimmed || goals.length >= MAX_GOALS) return;
    onChange([...goals, { text: trimmed }]);
    setInputValue("");
    inputRef.current?.focus();
  }, [inputValue, goals, onChange]);

  const handleRemove = useCallback(
    (index: number) => {
      onChange(goals.filter((_, i) => i !== index));
    },
    [goals, onChange],
  );

  const atLimit = goals.length >= MAX_GOALS;
  const hasInput = inputValue.trim().length > 0;

  return (
    <View style={styles.container}>
      <AppText variant="label" color={colors.textSecondary}>
        {t("settings.aiProfile.goals")}
      </AppText>

      {goals.map((goal, index) => {
        const text = getGoalText(goal);
        return (
          <View
            key={index}
            style={[styles.goalRow, { borderColor: colors.glassBorder }]}
          >
            <AppText
              variant="body"
              color={colors.textPrimary}
              style={styles.goalText}
            >
              {text}
            </AppText>
            <Pressable onPress={() => handleRemove(index)} hitSlop={8}>
              <Icon icon={Trash2} size="sm" color={colors.textTertiary} />
            </Pressable>
          </View>
        );
      })}

      {!atLimit ? (
        <View style={styles.addRow}>
          <RNTextInput
            ref={inputRef}
            style={[
              styles.input,
              {
                color: colors.textPrimary,
                backgroundColor: colors.glass,
                borderColor: hasInput ? colors.borderFocused : colors.glassBorder,
              },
            ]}
            value={inputValue}
            onChangeText={setInputValue}
            onSubmitEditing={handleAdd}
            placeholder={t("settings.aiProfile.goalPlaceholder")}
            placeholderTextColor={colors.textTertiary}
            returnKeyType="done"
            maxLength={200}
            selectionColor={colors.accent}
            keyboardAppearance={keyboardAppearance}
            blurOnSubmit={false}
          />
          <Pressable
            onPress={handleAdd}
            disabled={!hasInput}
            style={[
              styles.addButton,
              {
                borderColor: hasInput ? colors.borderFocused : colors.glassBorder,
                backgroundColor: hasInput ? colors.accentMuted : colors.glass,
              },
            ]}
          >
            <Icon
              icon={Plus}
              size="sm"
              color={hasInput ? colors.accent : colors.textTertiary}
            />
          </Pressable>
        </View>
      ) : (
        <AppText variant="caption" color={colors.textTertiary}>
          {t("settings.aiProfile.goalLimit", { max: MAX_GOALS })}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  goalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderRadius: radius.md,
    gap: spacing.sm,
  },
  goalText: {
    flex: 1,
  },
  addRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  input: {
    ...typography.body,
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 44,
  },
  addButton: {
    justifyContent: "center",
    alignItems: "center",
    width: 44,
    minHeight: 44,
    borderWidth: 1,
    borderRadius: radius.md,
  },
});
