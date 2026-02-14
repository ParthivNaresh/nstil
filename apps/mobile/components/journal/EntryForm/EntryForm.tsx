import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { Divider, MoodSelector, TextArea, TextInput } from "@/components/ui";
import { EntryDatePicker } from "@/components/journal/EntryDatePicker";
import { EntryTypeSelector } from "@/components/journal/EntryTypeSelector";
import { TagInput } from "@/components/journal/TagInput";
import { useTheme } from "@/hooks/useTheme";
import { spacing } from "@/styles";

import type { EntryFormProps } from "./types";

export function EntryForm({
  body,
  title,
  moodScore,
  tags,
  entryType,
  entryDate,
  bodyError,
  maxTags,
  onBodyChange,
  onTitleChange,
  onMoodChange,
  onEntryTypeChange,
  onDateChange,
  onAddTag,
  onRemoveTag,
}: EntryFormProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const maxDate = useMemo(() => new Date(), []);

  return (
    <View style={styles.container}>
      <EntryDatePicker
        value={entryDate}
        onChange={onDateChange}
        maximumDate={maxDate}
      />

      <TextArea
        label={t("journal.body")}
        value={body}
        onChangeText={onBodyChange}
        error={bodyError ? t(bodyError) : undefined}
        showCount
        minHeight={160}
        maxHeight={400}
      />

      <View style={styles.section}>
        <TextInput
          label={t("journal.title")}
          value={title}
          onChangeText={onTitleChange}
        />
      </View>

      <Divider color={colors.border} />

      <View style={styles.section}>
        <MoodSelector
          value={moodScore}
          onChange={onMoodChange}
          label={t("journal.mood")}
        />
      </View>

      <Divider color={colors.border} />

      <View style={styles.section}>
        <EntryTypeSelector
          value={entryType}
          onChange={onEntryTypeChange}
          label={t("journal.entryType")}
        />
      </View>

      <Divider color={colors.border} />

      <View style={styles.section}>
        <TagInput
          tags={tags}
          onAdd={onAddTag}
          onRemove={onRemoveTag}
          maxTags={maxTags}
          label={t("journal.tags")}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  section: {
    gap: spacing.sm,
  },
});
