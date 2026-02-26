import { useLocalSearchParams, useRouter } from "expo-router";
import { BookOpen } from "lucide-react-native";
import { useCallback, useMemo } from "react";
import { ActivityIndicator, FlatList, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useTranslation } from "react-i18next";

import {
  AnimatedEntryCard,
  EntryCardSkeleton,
  MoodSnapshotPill,
} from "@/components/journal";
import { EmptyState, Header } from "@/components/ui";
import {
  useEntries,
  useHeaderHeight,
  useJournal,
  useTheme,
} from "@/hooks";
import { spacing } from "@/styles";
import type { JournalEntry } from "@/types";

import { styles } from "@/styles/screens/journalDetailStyles";

const SKELETON_COUNT = 4;
const SKELETON_IDS = Array.from({ length: SKELETON_COUNT }, (_, i) => String(i));
const END_REACHED_THRESHOLD = 0.5;
const EMPTY_ENTRIES: JournalEntry[] = [];

export default function JournalDetailScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const headerHeight = useHeaderHeight();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: journal } = useJournal(id);
  const entriesQuery = useEntries(id);

  const entries = useMemo<JournalEntry[]>(
    () => entriesQuery.data?.pages.flatMap((page) => page.items) ?? EMPTY_ENTRIES,
    [entriesQuery.data],
  );

  const isFirstLoad = entriesQuery.isLoading;

  const handleEntryPress = useCallback(
    (entryId: string) => {
      router.push(`/entry/${entryId}`);
    },
    [router],
  );

  const handleEndReached = useCallback(() => {
    if (entriesQuery.hasNextPage && !entriesQuery.isFetchingNextPage) {
      entriesQuery.fetchNextPage();
    }
  }, [entriesQuery]);

  const renderItem = useCallback(
    ({ item, index }: { item: JournalEntry; index: number }) => {
      if (item.entry_type === "mood_snapshot") {
        return <MoodSnapshotPill entry={item} onPress={handleEntryPress} />;
      }
      return <AnimatedEntryCard entry={item} onPress={handleEntryPress} index={index} />;
    },
    [handleEntryPress],
  );

  const keyExtractor = useCallback((item: JournalEntry) => item.id, []);

  const headerTitle = journal?.name ?? "";

  const emptyComponent = isFirstLoad ? (
    <View>
      {SKELETON_IDS.map((skeletonId) => (
        <View key={skeletonId} style={styles.separator}>
          <EntryCardSkeleton />
        </View>
      ))}
    </View>
  ) : (
    <Animated.View entering={FadeIn.duration(300)} style={styles.emptyContainer}>
      <EmptyState
        icon={BookOpen}
        title={t("journal.detail.empty")}
        subtitle={t("journal.detail.emptySubtitle")}
        variant="minimal"
      />
    </Animated.View>
  );

  const footerComponent = entriesQuery.isFetchingNextPage ? (
    <View style={styles.footer}>
      <ActivityIndicator color={colors.textTertiary} />
    </View>
  ) : null;

  return (
    <View style={styles.root}>
      <Header
        title={headerTitle}
        onBack={router.back}
      />
      <FlatList
        data={entries}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListEmptyComponent={emptyComponent}
        ListFooterComponent={footerComponent}
        onEndReached={handleEndReached}
        onEndReachedThreshold={END_REACHED_THRESHOLD}
        contentContainerStyle={[
          styles.list,
          { paddingTop: headerHeight + spacing.sm },
          entries.length === 0 && styles.emptyList,
        ]}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={ListSeparator}
      />
    </View>
  );
}

function ListSeparator() {
  return <View style={styles.separator} />;
}
