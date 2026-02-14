import { X } from "lucide-react-native";
import { useCallback, useState } from "react";
import {
  Pressable,
  StyleSheet,
  TextInput as RNTextInput,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

import { AppText } from "@/components/ui/AppText";
import { Icon } from "@/components/ui/Icon";
import { colors, radius, spacing, typography } from "@/styles";

import type { TagInputProps } from "./types";

export function TagInput({
  tags,
  onAdd,
  onRemove,
  maxTags,
  label,
}: TagInputProps) {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState("");
  const canAdd = tags.length < maxTags;

  const handleSubmit = useCallback(() => {
    const trimmed = inputValue.trim();
    if (!trimmed || !canAdd) return;
    if (tags.includes(trimmed)) {
      setInputValue("");
      return;
    }
    onAdd(trimmed);
    setInputValue("");
  }, [inputValue, canAdd, tags, onAdd]);

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

      {tags.length > 0 ? (
        <View style={styles.tags}>
          {tags.map((tag) => (
            <View key={tag} style={styles.tag}>
              <AppText variant="caption" color={colors.accentLight}>
                {tag}
              </AppText>
              <Pressable
                onPress={() => onRemove(tag)}
                hitSlop={8}
                accessibilityLabel={`Remove tag ${tag}`}
              >
                <Icon icon={X} size="xs" color={colors.accentLight} />
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}

      {canAdd ? (
        <RNTextInput
          style={styles.input}
          value={inputValue}
          onChangeText={setInputValue}
          onSubmitEditing={handleSubmit}
          placeholder={t("journal.tagPlaceholder")}
          placeholderTextColor={colors.textTertiary}
          returnKeyType="done"
          autoCapitalize="none"
          selectionColor={colors.accent}
          keyboardAppearance="dark"
          blurOnSubmit={false}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    gap: spacing.sm,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.accentMuted,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  input: {
    ...typography.body,
    color: colors.textPrimary,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 44,
  },
});
