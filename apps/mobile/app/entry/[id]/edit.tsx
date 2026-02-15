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
import { AmbientBackground, Header, HeaderAction, Skeleton } from "@/components/ui";
import {
  useEntry,
  useEntryForm,
  useHeaderHeight,
  useJournals,
  useTheme,
} from "@/hooks";
import { spacing } from "@/styles";

export default function EditEntryScreen() {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const headerHeight = useHeaderHeight();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: entry, isLoading } = useEntry(id);

  if (isLoading || !entry) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <AmbientBackground />
        <StatusBar style={isDark ? "light" : "dark"} />
        <Header title={t("journal.editEntry")} onBack={router.back} />
        <View style={[styles.content, { paddingTop: headerHeight + spacing.md }]}>
          <Skeleton shape="rect" height={200} />
        </View>
      </View>
    );
  }

  return <EditEntryForm entryId={id} />;
}

function EditEntryForm({ entryId }: { readonly entryId: string }) {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const headerHeight = useHeaderHeight();
  const { data: entry } = useEntry(entryId);
  const { data: journals = [] } = useJournals();
  const form = useEntryForm({ entry, journals });

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
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <AmbientBackground />
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
              bodyError={form.bodyError}
              maxTags={form.maxTags}
              onJournalChange={form.setJournalId}
              onBodyChange={form.setBody}
              onTitleChange={form.setTitle}
              onMoodCategoryChange={form.setMoodCategory}
              onMoodSpecificChange={form.setMoodSpecific}
              onEntryTypeChange={form.setEntryType}
              onDateChange={form.setEntryDate}
              onAddTag={form.addTag}
              onRemoveTag={form.removeTag}
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
