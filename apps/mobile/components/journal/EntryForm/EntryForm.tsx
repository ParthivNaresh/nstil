import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { Divider, MoodSelector, TextArea, TextInput } from "@/components/ui";
import { EntryDatePicker } from "@/components/journal/EntryDatePicker";
import { EntryTypeSelector } from "@/components/journal/EntryTypeSelector";
import { ImageAttachmentStrip } from "@/components/journal/ImageAttachmentStrip";
import { JournalPicker } from "@/components/journal/JournalPicker";
import { TagInput } from "@/components/journal/TagInput";
import { useTheme } from "@/hooks/useTheme";
import { spacing } from "@/styles";

import type { EntryFormProps } from "./types";

export function EntryForm({
  journals,
  journalId,
  body,
  title,
  moodCategory,
  moodSpecific,
  tags,
  entryType,
  entryDate,
  bodyError,
  maxTags,
  localImages,
  existingMedia,
  removedMediaIds,
  maxImages,
  compressionProgress,
  onJournalChange,
  onBodyChange,
  onTitleChange,
  onMoodCategoryChange,
  onMoodSpecificChange,
  onEntryTypeChange,
  onDateChange,
  onAddTag,
  onRemoveTag,
  onPickImages,
  onRemoveLocalImage,
  onRemoveExistingMedia,
}: EntryFormProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const maxDate = useMemo(() => new Date(), []);

  return (
    <View style={styles.container}>
      <JournalPicker
        journals={journals}
        selectedId={journalId}
        onSelect={onJournalChange}
      />

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
        variant="flat"
        showCount
        minHeight={160}
        maxHeight={400}
      />

      <TextInput
        label={t("journal.title")}
        value={title}
        onChangeText={onTitleChange}
        variant="flat"
      />

      <ImageAttachmentStrip
        localImages={localImages}
        existingMedia={existingMedia}
        removedMediaIds={removedMediaIds}
        compressionProgress={compressionProgress}
        onPickImages={onPickImages}
        onRemoveLocal={onRemoveLocalImage}
        onRemoveExisting={onRemoveExistingMedia}
        maxImages={maxImages}
      />

      <Divider color={colors.border} />

      <View style={styles.section}>
        <MoodSelector
          category={moodCategory}
          specific={moodSpecific}
          onCategoryChange={onMoodCategoryChange}
          onSpecificChange={onMoodSpecificChange}
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
