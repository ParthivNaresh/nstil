import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

import { CreateJournalForm } from "@/components/journal";
import { Header, HeaderAction } from "@/components/ui";
import { useCreateJournalForm, useHeaderHeight, useTheme } from "@/hooks";
import { spacing } from "@/styles";

export default function CreateJournalScreen() {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const router = useRouter();
  const headerHeight = useHeaderHeight();
  const form = useCreateJournalForm();

  const handleSave = useCallback(() => {
    form.handleSubmit();
  }, [form]);

  const saveAction = (
    <HeaderAction
      title={t("journal.create.save")}
      onPress={handleSave}
      loading={form.isSubmitting}
      disabled={!form.canSubmit}
    />
  );

  return (
    <View style={styles.root}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Header
        title={t("journal.create.title")}
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
            { paddingTop: headerHeight + spacing.lg },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <CreateJournalForm
              name={form.name}
              nameError={form.nameError}
              description={form.description}
              color={form.color}
              onNameChange={form.setName}
              onDescriptionChange={form.setDescription}
              onColorChange={form.setColor}
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
