import { Plus, X } from "lucide-react-native";
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
import { withAlpha } from "@/lib/colorUtils";
import { radius, spacing, typography } from "@/styles";

interface TopicsToAvoidProps {
  readonly topics: string[];
  readonly onChange: (topics: string[]) => void;
}

const MAX_TOPICS = 20;

export function TopicsToAvoid({ topics, onChange }: TopicsToAvoidProps) {
  const { t } = useTranslation();
  const { colors, keyboardAppearance } = useTheme();
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<RNTextInput>(null);

  const handleAdd = useCallback(() => {
    const trimmed = inputValue.trim();
    if (!trimmed || topics.length >= MAX_TOPICS || topics.includes(trimmed)) {
      return;
    }
    onChange([...topics, trimmed]);
    setInputValue("");
    inputRef.current?.focus();
  }, [inputValue, topics, onChange]);

  const handleRemove = useCallback(
    (topic: string) => {
      onChange(topics.filter((t) => t !== topic));
    },
    [topics, onChange],
  );

  const atLimit = topics.length >= MAX_TOPICS;
  const hasInput = inputValue.trim().length > 0;

  return (
    <View style={styles.container}>
      <AppText variant="label" color={colors.textSecondary}>
        {t("settings.aiProfile.topicsToAvoid")}
      </AppText>

      {topics.length > 0 ? (
        <View style={styles.tagRow}>
          {topics.map((topic) => (
            <View
              key={topic}
              style={[styles.tag, { backgroundColor: colors.errorMuted, borderColor: withAlpha(colors.error, 0.2) }]}
            >
              <AppText variant="caption" color={colors.error}>
                {topic}
              </AppText>
              <Pressable onPress={() => handleRemove(topic)} hitSlop={6}>
                <Icon icon={X} size="xs" color={colors.error} />
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}

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
            placeholder={t("settings.aiProfile.topicPlaceholder")}
            placeholderTextColor={colors.textTertiary}
            returnKeyType="done"
            maxLength={50}
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
          {t("settings.aiProfile.topicLimit", { max: MAX_TOPICS })}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
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
