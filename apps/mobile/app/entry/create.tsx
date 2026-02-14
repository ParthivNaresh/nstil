import { useRouter } from "expo-router";
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
import { useEntryForm, useHeaderHeight } from "@/hooks";
import { colors, spacing } from "@/styles";

export default function CreateEntryScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const headerHeight = useHeaderHeight();
  const form = useEntryForm();

  const saveAction = (
    <HeaderAction
      title={t("journal.save")}
      onPress={form.handleSubmit}
      loading={form.isSubmitting}
      disabled={!form.canSubmit}
    />
  );

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
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
              body={form.body}
              title={form.title}
              moodScore={form.moodScore}
              tags={form.tags}
              entryType={form.entryType}
              bodyError={form.bodyError}
              maxTags={form.maxTags}
              onBodyChange={form.setBody}
              onTitleChange={form.setTitle}
              onMoodChange={form.setMoodScore}
              onEntryTypeChange={form.setEntryType}
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
    backgroundColor: colors.background,
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
