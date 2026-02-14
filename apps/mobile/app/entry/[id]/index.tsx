import { useLocalSearchParams, useRouter } from "expo-router";
import { FileQuestion, Pencil } from "lucide-react-native";
import { useCallback } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useTranslation } from "react-i18next";

import { EntryDetailContent } from "@/components/journal";
import { Button, EmptyState, Header, Icon, Skeleton } from "@/components/ui";
import { useDeleteEntry, useEntry, useHeaderHeight } from "@/hooks";
import { colors, spacing } from "@/styles";

export default function EntryDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const headerHeight = useHeaderHeight();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: entry, isLoading } = useEntry(id);
  const deleteMutation = useDeleteEntry();

  const handleEdit = useCallback(() => {
    router.push(`/entry/${id}/edit`);
  }, [router, id]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      t("journal.detail.deleteTitle"),
      t("journal.detail.deleteMessage"),
      [
        { text: t("journal.detail.deleteCancel"), style: "cancel" },
        {
          text: t("journal.detail.deleteConfirm"),
          style: "destructive",
          onPress: () => {
            deleteMutation.mutate(id, {
              onSuccess: () => router.back(),
            });
          },
        },
      ],
    );
  }, [t, id, deleteMutation, router]);

  const editButton = (
    <Pressable onPress={handleEdit} accessibilityLabel={t("journal.detail.edit")}>
      <Icon icon={Pencil} size="sm" color={colors.accent} />
    </Pressable>
  );

  if (isLoading) {
    return (
      <View style={styles.root}>
        <StatusBar style="light" />
        <Header title="" onBack={router.back} />
        <View style={[styles.content, { paddingTop: headerHeight + spacing.md }]}>
          <Skeleton shape="text" width="40%" height={12} />
          <Skeleton shape="text" width="70%" height={20} />
          <Skeleton shape="rect" height={120} />
          <Skeleton shape="text" width="50%" height={14} />
        </View>
      </View>
    );
  }

  if (!entry) {
    return (
      <View style={styles.root}>
        <StatusBar style="light" />
        <Header title="" onBack={router.back} />
        <View style={styles.emptyContainer}>
          <EmptyState
            icon={FileQuestion}
            title={t("journal.detail.notFound")}
            subtitle={t("journal.detail.notFoundSubtitle")}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <Header title="" onBack={router.back} rightAction={editButton} />
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: headerHeight + spacing.md },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <EntryDetailContent entry={entry} />
          <View style={styles.deleteSection}>
            <Button
              title={t("journal.detail.delete")}
              onPress={handleDelete}
              variant="ghost"
              loading={deleteMutation.isPending}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.xl,
  },
  content: {
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
  },
  deleteSection: {
    marginTop: spacing.xl,
  },
});
