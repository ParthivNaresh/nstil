import { X } from "lucide-react-native";
import { useCallback, useRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  TextInput as RNTextInput,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

import { AppText } from "@/components/ui/AppText";
import { Icon } from "@/components/ui/Icon";
import { useTheme } from "@/hooks/useTheme";
import { radius, spacing, typography } from "@/styles";

import type { TagInputProps } from "./types";

export function TagInput({
  tags,
  onAdd,
  onRemove,
  maxTags,
  label,
}: TagInputProps) {
  const { t } = useTranslation();
  const { colors, keyboardAppearance } = useTheme();
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<RNTextInput>(null);
  const canAddMore = tags.length < maxTags;

  const handleSubmit = useCallback(() => {
    const trimmed = inputValue.trim();
    if (trimmed && canAddMore) {
      onAdd(trimmed);
      setInputValue("");
    }
  }, [inputValue, canAddMore, onAdd]);

  return (
    <View style={styles.container}>
      {label ? (
        <View style={styles.labelRow}>
          <AppText variant="caption" color={colors.textSecondary}>
            {label}
          </AppText>
          <AppText variant="caption" color={colors.textTertiary}>
            {t("journal.tagLimit", { max: maxTags })}
          </AppText>
        </View>
      ) : null}

      <View style={styles.tagsRow}>
        {tags.map((tag) => (
          <View key={tag} style={[styles.tag, { backgroundColor: colors.accentMuted }]}>
            <AppText variant="caption" color={colors.accentLight}>
              {tag}
            </AppText>
            <Pressable
              onPress={() => onRemove(tag)}
              hitSlop={4}
              accessibilityLabel={`Remove tag ${tag}`}
            >
              <Icon icon={X} size="xs" color={colors.accentLight} />
            </Pressable>
          </View>
        ))}
      </View>

      {canAddMore ? (
        <RNTextInput
          ref={inputRef}
          style={[
            styles.input,
            {
              color: colors.textPrimary,
              backgroundColor: colors.glass,
              borderColor: colors.glassBorder,
            },
          ]}
          value={inputValue}
          onChangeText={setInputValue}
          onSubmitEditing={handleSubmit}
          placeholder={t("journal.tagPlaceholder")}
          placeholderTextColor={colors.textTertiary}
          returnKeyType="done"
          autoCapitalize="none"
          selectionColor={colors.accent}
          keyboardAppearance={keyboardAppearance}
          blurOnSubmit={false}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 1,
  },
  input: {
    ...typography.body,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 44,
  },
});
