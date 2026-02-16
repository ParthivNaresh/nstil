import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo } from "react";
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
import { Header, HeaderAction } from "@/components/ui";
import {
  useEntryForm,
  useHeaderHeight,
  useJournals,
  useTheme,
} from "@/hooks";
import { spacing } from "@/styles";

function buildDateWithCurrentTime(dateString: string): Date {
  const [yearStr, monthStr, dayStr] = dateString.split("-");
  const now = new Date();
  return new Date(
    Number(yearStr),
    Number(monthStr) - 1,
    Number(dayStr),
    now.getHours(),
    now.getMinutes(),
    now.getSeconds(),
  );
}

export default function CreateEntryScreen() {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const router = useRouter();
  const headerHeight = useHeaderHeight();
  const params = useLocalSearchParams<{ date?: string }>();
  const { data: journals = [] } = useJournals();

  const initialDate = useMemo(
    () => (params.date ? buildDateWithCurrentTime(params.date) : undefined),
    [params.date],
  );

  const form = useEntryForm({ journals, initialDate });

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
        title={t("journal.newEntry")}
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
