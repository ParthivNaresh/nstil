import { useRouter } from "expo-router";
import { BookOpen, Plus, SearchX } from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { AnimatedEntryCard, EntryCardSkeleton, JournalFilterBar } from "@/components/journal";
import {
  AmbientBackground,
  EmptyState,
  Header,
  Icon,
  SearchInput,
} from "@/components/ui";
import {
  useEntries,
  useHeaderHeight,
  useJournals,
  useSearchEntries,
  useTheme,
} from "@/hooks";
import { spacing } from "@/styles";
import type { JournalEntry } from "@/types";

import { styles } from "./historyStyles";

const SKELETON_COUNT = 4;
const SKELETON_IDS = Array.from({ length: SKELETON_COUNT }, (_, i) => String(i));
const PAGINATION_THRESHOLD = 0.5;
const EMPTY_ENTRIES: JournalEntry[] = [];

export default function HistoryScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJournalId, setSelectedJournalId] = useState<string | null>(null);
  const isSearching = searchQuery.trim().length > 0;

  const { data: journals = [] } = useJournals();
  const listQuery = useEntries(selectedJournalId ?? undefined);
  const searchQueryResult = useSearchEntries(searchQuery, selectedJournalId ?? undefined);

  const activeQuery = isSearching ? searchQueryResult : listQuery;

  const entries = useMemo<JournalEntry[]>(
    () => activeQuery.data?.pages.flatMap((page) => page.items) ?? EMPTY_ENTRIES,
    [activeQuery.data],
  );

  const isInitialLoad = activeQuery.isLoading && !activeQuery.isError;
  const isEmpty = !isInitialLoad && entries.length === 0;

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
    if (activeQuery.hasNextPage && !activeQuery.isFetchingNextPage) {
      void activeQuery.fetchNextPage();
    }
  }, [activeQuery]);

  const handleRefresh = useCallback(() => {
    void activeQuery.refetch();
  }, [activeQuery]);

  const renderItem = useCallback(
    ({ item, index }: { item: JournalEntry; index: number }) => (
      <AnimatedEntryCard entry={item} onPress={handleEntryPress} index={index} />
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

  const emptyIcon = isSearching ? SearchX : BookOpen;
  const emptyTitle = isSearching
    ? t("history.searchEmptyTitle")
    : t("history.emptyTitle");
  const emptySubtitle = isSearching
    ? t("history.searchEmptySubtitle")
    : t("history.emptySubtitle");

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <AmbientBackground />
      <Header title={t("tabs.history")} rightAction={createButton} />

      <View style={[styles.searchWrapper, { paddingTop: headerHeight + spacing.sm }]}>
        <SearchInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={t("history.searchPlaceholder")}
        />
      </View>

      <View style={styles.filterWrapper}>
        <JournalFilterBar
          journals={journals}
          selectedId={selectedJournalId}
          onSelect={setSelectedJournalId}
        />
      </View>

      {isInitialLoad ? (
        <View style={styles.list}>
          {SKELETON_IDS.map((id) => (
            <View key={id} style={styles.cardWrapper}>
              <EntryCardSkeleton />
            </View>
          ))}
        </View>
      ) : isEmpty ? (
        <View style={styles.emptyContainer}>
          <EmptyState
            icon={emptyIcon}
            title={emptyTitle}
            subtitle={emptySubtitle}
            actionLabel={isSearching ? undefined : t("history.emptyAction")}
            onAction={isSearching ? undefined : handleCreatePress}
          />
        </View>
      ) : (
        <FlatList
          data={entries}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + spacing.lg },
          ]}
          onEndReached={handleEndReached}
          onEndReachedThreshold={PAGINATION_THRESHOLD}
          refreshControl={
            <RefreshControl
              refreshing={activeQuery.isRefetching && !activeQuery.isFetchingNextPage}
              onRefresh={handleRefresh}
              tintColor={colors.accent}
              progressBackgroundColor={colors.surface}
              progressViewOffset={headerHeight}
            />
          }
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={ItemSeparator}
          ListFooterComponent={
            activeQuery.isFetchingNextPage ? (
              <View style={styles.footer}>
                <ActivityIndicator size="small" color={colors.accent} />
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

function ItemSeparator() {
  return <View style={styles.separator} />;
}
