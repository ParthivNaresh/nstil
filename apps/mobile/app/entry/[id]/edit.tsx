import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useTranslation } from "react-i18next";

import { EntryForm } from "@/components/journal";
import { Header, HeaderAction, Skeleton } from "@/components/ui";
import {
  useEntry,
  useEntryForm,
  useEntryMedia,
  useHeaderHeight,
  useJournals,
  useTheme,
} from "@/hooks";
import { spacing } from "@/styles";
import type { EntryMedia } from "@/types";

export default function EditEntryScreen() {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const router = useRouter();
  const headerHeight = useHeaderHeight();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: entry, isLoading: entryLoading } = useEntry(id);
  const { data: mediaResponse, isLoading: mediaLoading } = useEntryMedia(id);

  const isLoading = entryLoading || mediaLoading;

  if (isLoading || !entry) {
    return (
      <View style={styles.root}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <Header title={t("journal.editEntry")} onBack={router.back} />
        <View style={[styles.content, { paddingTop: headerHeight + spacing.md }]}>
          <Skeleton shape="rect" height={200} />
        </View>
      </View>
    );
  }

  return (
    <EditEntryForm
      entryId={id}
      existingMediaItems={mediaResponse?.items ?? []}
    />
  );
}

interface EditEntryFormProps {
  readonly entryId: string;
  readonly existingMediaItems: EntryMedia[];
}

function EditEntryForm({ entryId, existingMediaItems }: EditEntryFormProps) {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const router = useRouter();
  const headerHeight = useHeaderHeight();
  const { data: entry } = useEntry(entryId);
  const { data: journals = [] } = useJournals();
  const form = useEntryForm({
    entry,
    journals,
    existingMedia: existingMediaItems,
  });

  const handleSave = useCallback(() => {
    form.handleSubmit();
  }, [form]);

  const saveAction = (
    <HeaderAction
      title={t("journal.save")}
      onPress={handleSave}
      loading={form.isSubmitting}
      disabled={!form.canSubmit}
    />
  );

  return (
    <View style={styles.root}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Header
        title={t("journal.editEntry")}
        onBack={router.back}
        rightAction={saveAction}
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: headerHeight + spacing.md },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <EntryForm
              journals={journals}
              journalId={form.journalId}
              body={form.body}
              title={form.title}
              moodCategory={form.moodCategory}
              moodSpecific={form.moodSpecific}
              tags={form.tags}
              entryType={form.entryType}
              entryDate={form.entryDate}
              location={form.location}
              bodyError={form.bodyError}
              maxTags={form.maxTags}
              localImages={form.localImages}
              existingMedia={form.existingMedia}
              removedMediaIds={form.removedMediaIds}
              maxImages={form.maxImages}
              compressionProgress={form.compressionProgress}
              onJournalChange={form.setJournalId}
              onBodyChange={form.setBody}
              onTitleChange={form.setTitle}
              onMoodCategoryChange={form.setMoodCategory}
              onMoodSpecificChange={form.setMoodSpecific}
              onEntryTypeChange={form.setEntryType}
              onDateChange={form.setEntryDate}
              onLocationChange={form.setLocation}
              onAddTag={form.addTag}
              onRemoveTag={form.removeTag}
              onPickImages={form.handlePickImages}
              onRemoveLocalImage={form.removeLocalImage}
              onRemoveExistingMedia={form.removeExistingMedia}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.xl,
  },
  content: {
    paddingHorizontal: spacing.md,
  },
});
