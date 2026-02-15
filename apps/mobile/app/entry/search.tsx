import { useRouter } from "expo-router";
import { SearchX, X } from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import {
  AnimatedEntryCard,
  JournalFilterBar,
} from "@/components/journal";
import {
  EmptyState,
  Header,
  Icon,
  SearchInput,
} from "@/components/ui";
import {
  useHeaderHeight,
  useJournals,
  useSearchEntries,
  useTheme,
} from "@/hooks";
import { spacing } from "@/styles";
import type { JournalEntry } from "@/types";

const PAGINATION_THRESHOLD = 0.5;
const EMPTY_ENTRIES: JournalEntry[] = [];

export default function SearchScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJournalId, setSelectedJournalId] = useState<string | null>(null);

  const { data: journals = [] } = useJournals();
  const searchResult = useSearchEntries(searchQuery, selectedJournalId ?? undefined);

  const entries = useMemo<JournalEntry[]>(
    () => searchResult.data?.pages.flatMap((page) => page.items) ?? EMPTY_ENTRIES,
    [searchResult.data],
  );

  const isSearching = searchQuery.trim().length > 0;
  const isEmpty = isSearching && !searchResult.isLoading && entries.length === 0;

  const handleEntryPress = useCallback(
    (id: string) => {
      router.push(`/entry/${id}`);
    },
    [router],
  );

  const handleEndReached = useCallback(() => {
    if (searchResult.hasNextPage && !searchResult.isFetchingNextPage) {
      void searchResult.fetchNextPage();
    }
  }, [searchResult]);

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

  const closeButton = (
    <Pressable onPress={router.back} accessibilityLabel="Close search">
      <Icon icon={X} size="md" color={colors.textSecondary} />
    </Pressable>
  );

  const listHeader = (
    <View style={localStyles.listHeader}>
      <SearchInput
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder={t("history.searchPlaceholder")}
        autoFocus
      />
      <JournalFilterBar
        journals={journals}
        selectedId={selectedJournalId}
        onSelect={setSelectedJournalId}
      />
    </View>
  );

  return (
    <View style={localStyles.root}>
      <Header title={t("history.searchTitle")} rightAction={closeButton} />

      <FlatList
        data={entries}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={listHeader}
        contentContainerStyle={[
          localStyles.list,
          {
            paddingTop: headerHeight + spacing.sm,
            paddingBottom: insets.bottom + spacing.lg,
          },
          isEmpty && localStyles.emptyList,
        ]}
        onEndReached={handleEndReached}
        onEndReachedThreshold={PAGINATION_THRESHOLD}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={ItemSeparator}
        ListEmptyComponent={
          isSearching && !searchResult.isLoading ? (
            <View style={localStyles.emptyContainer}>
              <EmptyState
                icon={SearchX}
                title={t("history.searchEmptyTitle")}
                subtitle={t("history.searchEmptySubtitle")}
              />
            </View>
          ) : null
        }
        ListFooterComponent={
          searchResult.isFetchingNextPage ? (
            <View style={localStyles.footer}>
              <ActivityIndicator size="small" color={colors.accent} />
            </View>
          ) : null
        }
      />
    </View>
  );
}

function ItemSeparator() {
  return <View style={localStyles.separator} />;
}

const localStyles = StyleSheet.create({
  root: {
    flex: 1,
  },
  listHeader: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  list: {
    paddingHorizontal: spacing.md,
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    paddingVertical: spacing.xl,
  },
  separator: {
    height: spacing.md,
  },
  footer: {
    paddingVertical: spacing.lg,
    alignItems: "center",
  },
});
