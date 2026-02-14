import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { MoodSelector, TextArea, TextInput } from "@/components/ui";
import { EntryTypeSelector } from "@/components/journal/EntryTypeSelector";
import { TagInput } from "@/components/journal/TagInput";
import { spacing } from "@/styles";

import type { EntryFormProps } from "./types";

export function EntryForm({
  body,
  title,
  moodScore,
  tags,
  entryType,
  bodyError,
  maxTags,
  onBodyChange,
  onTitleChange,
  onMoodChange,
  onEntryTypeChange,
  onAddTag,
  onRemoveTag,
}: EntryFormProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <TextArea
        label={t("journal.body")}
        value={body}
        onChangeText={onBodyChange}
        error={bodyError ? t(bodyError) : undefined}
        showCount
        minHeight={160}
        maxHeight={400}
      />

      <TextInput
        label={t("journal.title")}
        value={title}
        onChangeText={onTitleChange}
      />

      <MoodSelector
        value={moodScore}
        onChange={onMoodChange}
        label={t("journal.mood")}
      />

      <EntryTypeSelector
        value={entryType}
        onChange={onEntryTypeChange}
        label={t("journal.entryType")}
      />

      <TagInput
        tags={tags}
        onAdd={onAddTag}
        onRemove={onRemoveTag}
        maxTags={maxTags}
        label={t("journal.tags")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
});
