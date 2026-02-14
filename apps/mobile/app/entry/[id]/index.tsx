import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { FileQuestion, Pencil, Pin, PinOff } from "lucide-react-native";
import { useCallback } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { EntryDetailContent } from "@/components/journal";
import { AmbientBackground, Button, EmptyState, Header, Icon, Skeleton } from "@/components/ui";
import { useDeleteEntry, useEntry, useHeaderHeight, useTheme, useTogglePin } from "@/hooks";
import { spacing } from "@/styles";

import { styles } from "./styles";

export default function EntryDetailScreen() {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: entry, isLoading } = useEntry(id);
  const deleteMutation = useDeleteEntry();
  const togglePinMutation = useTogglePin();

  const handleEdit = useCallback(() => {
    router.push(`/entry/${id}/edit`);
  }, [router, id]);

  const handleTogglePin = useCallback(() => {
    if (!entry) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    togglePinMutation.mutate({ id: entry.id, isPinned: entry.is_pinned });
  }, [entry, togglePinMutation]);

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

  const headerActions = entry ? (
    <View style={styles.headerActions}>
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
      <Pressable onPress={handleEdit} accessibilityLabel={t("journal.detail.edit")}>
        <Icon icon={Pencil} size="sm" color={colors.accent} />
      </Pressable>
    </View>
  ) : null;

  if (isLoading) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <AmbientBackground />
        <StatusBar style={isDark ? "light" : "dark"} />
        <Header title="" onBack={router.back} />
        <View style={[styles.content, { paddingTop: headerHeight + spacing.lg }]}>
          <Skeleton shape="rect" height={80} />
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
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <AmbientBackground />
        <StatusBar style={isDark ? "light" : "dark"} />
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
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <AmbientBackground />
      <StatusBar style={isDark ? "light" : "dark"} />
      <Header title="" onBack={router.back} rightAction={headerActions} />
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: headerHeight + spacing.lg,
            paddingBottom: insets.bottom + spacing.xl,
          },
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
