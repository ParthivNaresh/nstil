import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { FileQuestion, Pin, PinOff, Trash2 } from "lucide-react-native";
import { useCallback } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useTranslation } from "react-i18next";

import { EntryForm, MoodSnapshotDetail, ReflectionCard } from "@/components/journal";
import { EmptyState, Header, HeaderAction, Icon, Skeleton } from "@/components/ui";
import {
  useDeleteEntry,
  useEntry,
  useEntryForm,
  useEntryMedia,
  useEntryReflection,
  useHeaderHeight,
  useJournals,
  useTheme,
  useTogglePin,
} from "@/hooks";
import { spacing } from "@/styles";
import type { EntryMedia } from "@/types";

export default function EntryScreen() {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const router = useRouter();
  const headerHeight = useHeaderHeight();
  const { id, prompt } = useLocalSearchParams<{ id: string; prompt?: string }>();
  const { data: entry, isLoading: entryLoading } = useEntry(id);
  const { data: mediaResponse, isLoading: mediaLoading } = useEntryMedia(id);

  const isLoading = entryLoading || mediaLoading;

  if (isLoading) {
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

  if (!entry) {
    return (
      <View style={styles.root}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <Header title="" onBack={router.back} />
        <View style={styles.emptyContainer}>
          <EmptyState
            icon={FileQuestion}
            title={t("journal.entryDetail.notFound")}
            subtitle={t("journal.entryDetail.notFoundSubtitle")}
          />
        </View>
      </View>
    );
  }

  if (entry.entry_type === "mood_snapshot") {
    return <MoodSnapshotScreen entryId={id} />;
  }

  return (
    <EntryFormScreen
      entryId={id}
      existingMediaItems={mediaResponse?.items ?? []}
      bodyLabel={prompt}
    />
  );
}

interface EntryFormScreenProps {
  readonly entryId: string;
  readonly existingMediaItems: EntryMedia[];
  readonly bodyLabel?: string;
}

function EntryFormScreen({ entryId, existingMediaItems, bodyLabel }: EntryFormScreenProps) {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const headerHeight = useHeaderHeight();
  const { data: entry } = useEntry(entryId);
  const { data: journals = [] } = useJournals();
  const deleteMutation = useDeleteEntry();
  const togglePinMutation = useTogglePin();
  const {
    reflection,
    dismiss: dismissReflection,
    isDismissing,
  } = useEntryReflection(entryId);
  const form = useEntryForm({
    entry,
    journals,
    existingMedia: existingMediaItems,
  });

  const handleSave = useCallback(() => {
    form.handleSubmit();
  }, [form]);

  const handleTogglePin = useCallback(() => {
    if (!entry) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    togglePinMutation.mutate({ id: entry.id, isPinned: entry.is_pinned });
  }, [entry, togglePinMutation]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      t("journal.entryDetail.deleteTitle"),
      t("journal.entryDetail.deleteMessage"),
      [
        { text: t("journal.entryDetail.deleteCancel"), style: "cancel" },
        {
          text: t("journal.entryDetail.deleteConfirm"),
          style: "destructive",
          onPress: () => {
            deleteMutation.mutate(entryId, {
              onSuccess: () => router.back(),
            });
          },
        },
      ],
    );
  }, [t, entryId, deleteMutation, router]);

  const headerActions = (
    <View style={styles.headerActions}>
      {entry ? (
        <Pressable
          onPress={handleTogglePin}
          accessibilityLabel={entry.is_pinned ? "Unpin entry" : "Pin entry"}
        >
          <Icon
            icon={entry.is_pinned ? PinOff : Pin}
            size="sm"
            color={entry.is_pinned ? colors.accent : colors.textTertiary}
          />
        </Pressable>
      ) : null}
      <Pressable
        onPress={handleDelete}
        accessibilityLabel={t("journal.entryDetail.delete")}
      >
        <Icon icon={Trash2} size="sm" color={colors.textTertiary} />
      </Pressable>
      <HeaderAction
        title={t("journal.save")}
        onPress={handleSave}
        loading={form.isSubmitting}
        disabled={!form.canSubmit}
      />
    </View>
  );

  return (
    <View style={styles.root}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Header
        title={t("journal.editEntry")}
        onBack={router.back}
        rightAction={headerActions}
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
              bodyLabel={bodyLabel}
              reflectionSlot={
                reflection ? (
                  <ReflectionCard
                    content={reflection.content}
                    onDismiss={dismissReflection}
                    isDismissing={isDismissing}
                  />
                ) : undefined
              }
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
              localAudio={form.localAudio}
              existingAudio={form.existingAudio}
              isRecordingAudio={form.isRecordingAudio}
              onStartRecording={form.startRecording}
              onStopRecording={form.stopRecording}
              onRecordAudio={form.recordAudio}
              onRemoveAudio={form.removeAudio}
              onRemoveExistingMedia={form.removeExistingMedia}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

interface MoodSnapshotScreenProps {
  readonly entryId: string;
}

function MoodSnapshotScreen({ entryId }: MoodSnapshotScreenProps) {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const headerHeight = useHeaderHeight();
  const { data: entry } = useEntry(entryId);
  const deleteMutation = useDeleteEntry();

  const handleDelete = useCallback(() => {
    Alert.alert(
      t("journal.entryDetail.deleteTitle"),
      t("journal.entryDetail.deleteMessage"),
      [
        { text: t("journal.entryDetail.deleteCancel"), style: "cancel" },
        {
          text: t("journal.entryDetail.deleteConfirm"),
          style: "destructive",
          onPress: () => {
            deleteMutation.mutate(entryId, {
              onSuccess: () => router.back(),
            });
          },
        },
      ],
    );
  }, [t, entryId, deleteMutation, router]);

  const deleteAction = (
    <Pressable
      onPress={handleDelete}
      accessibilityLabel={t("journal.entryDetail.delete")}
    >
      <Icon icon={Trash2} size="sm" color={colors.textTertiary} />
    </Pressable>
  );

  return (
    <View style={styles.root}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Header
        title=""
        onBack={router.back}
        rightAction={deleteAction}
      />
      <View style={[styles.snapshotContent, { paddingTop: headerHeight + spacing.xl }]}>
        {entry ? <MoodSnapshotDetail entry={entry} /> : null}
      </View>
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
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.xl,
  },
  content: {
    paddingHorizontal: spacing.md,
  },
  snapshotContent: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
  },
});
