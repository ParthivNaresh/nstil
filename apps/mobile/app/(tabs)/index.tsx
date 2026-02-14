import { useRouter } from "expo-router";
import { Plus, BookOpen } from "lucide-react-native";
import { useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { EntryCard, EntryCardSkeleton } from "@/components/journal";
import { EmptyState, Header, Icon } from "@/components/ui";
import { useEntries, useHeaderHeight } from "@/hooks";
import { colors, spacing } from "@/styles";
import type { JournalEntry } from "@/types";

const SKELETON_COUNT = 4;
const SKELETON_IDS = Array.from({ length: SKELETON_COUNT }, (_, i) => String(i));
const PAGINATION_THRESHOLD = 0.5;

export default function JournalScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();

  const {
    data,
    isLoading,
    isError,
    isRefetching,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    refetch,
  } = useEntries();

  const entries = useMemo<JournalEntry[]>(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data],
  );

  const handleEntryPress = useCallback(
    (id: string) => {
      router.push(`/entry/${id}`);
    },
    [router],
  );

  const handleCreatePress = useCallback(() => {
    router.push("/entry/create");
  }, [router]);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleRefresh = useCallback(() => {
    void refetch();
  }, [refetch]);

  const renderItem = useCallback(
    ({ item }: { item: JournalEntry }) => (
      <EntryCard entry={item} onPress={handleEntryPress} />
    ),
    [handleEntryPress],
  );

  const keyExtractor = useCallback(
    (item: JournalEntry) => item.id,
    [],
  );

  const createButton = (
    <Pressable onPress={handleCreatePress} accessibilityLabel="Create entry">
      <Icon icon={Plus} size="md" color={colors.accent} />
    </Pressable>
  );

  if (isLoading && !isError) {
    return (
      <View style={styles.root}>
        <Header title={t("tabs.journal")} rightAction={createButton} />
        <View style={[styles.list, { paddingTop: headerHeight + spacing.sm }]}>
          {SKELETON_IDS.map((id) => (
            <View key={id} style={styles.cardWrapper}>
              <EntryCardSkeleton />
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (entries.length === 0) {
    return (
      <View style={styles.root}>
        <Header title={t("tabs.journal")} rightAction={createButton} />
        <View style={[styles.emptyContainer, { paddingTop: headerHeight }]}>
          <EmptyState
            icon={BookOpen}
            title={t("journal.emptyTitle")}
            subtitle={t("journal.emptySubtitle")}
            actionLabel={t("journal.emptyAction")}
            onAction={handleCreatePress}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Header title={t("tabs.journal")} rightAction={createButton} />
      <FlatList
        data={entries}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={[
          styles.list,
          {
            paddingTop: headerHeight + spacing.sm,
            paddingBottom: insets.bottom + spacing.lg,
          },
        ]}
        onEndReached={handleEndReached}
        onEndReachedThreshold={PAGINATION_THRESHOLD}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching && !isFetchingNextPage}
            onRefresh={handleRefresh}
            tintColor={colors.accent}
            progressBackgroundColor={colors.surface}
            progressViewOffset={headerHeight}
          />
        }
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={ItemSeparator}
        ListFooterComponent={
          isFetchingNextPage ? <PaginationSpinner /> : null
        }
      />
    </View>
  );
}

function ItemSeparator() {
  return <View style={styles.separator} />;
}

function PaginationSpinner() {
  return (
    <View style={styles.footer}>
      <ActivityIndicator size="small" color={colors.accent} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    paddingHorizontal: spacing.md,
  },
  cardWrapper: {
    marginBottom: spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
  },
  separator: {
    height: spacing.sm,
  },
  footer: {
    paddingVertical: spacing.lg,
    alignItems: "center",
  },
});
