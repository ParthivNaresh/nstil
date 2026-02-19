import { useRouter } from "expo-router";
import { Feather, Search } from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import { FlatList, Pressable, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import {
  AnimatedEntryCard,
  Calendar,
  DayActionBar,
  EntryCardSkeleton,
} from "@/components/journal";
import {
  EmptyState,
  Header,
  Icon,
} from "@/components/ui";
import {
  useCalendarRange,
  useDayEntries,
  useHeaderHeight,
  useTheme,
} from "@/hooks";
import { formatDateString } from "@/lib/calendarUtils";
import { spacing } from "@/styles";
import type { JournalEntry } from "@/types";

import { styles } from "@/styles/screens/historyStyles";

const SKELETON_COUNT = 3;
const SKELETON_IDS = Array.from({ length: SKELETON_COUNT }, (_, i) => String(i));
const DAY_SEARCH_THRESHOLD = 5;
const EMPTY_ENTRIES: JournalEntry[] = [];

function getTodayString(): string {
  const now = new Date();
  return formatDateString(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

export default function HistoryScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();

  const [selectedDate, setSelectedDate] = useState(getTodayString);
  const [inlineSearch, setInlineSearch] = useState("");

  const calendarData = useCalendarRange();
  const dayQuery = useDayEntries(selectedDate);

  const dayEntries = useMemo<JournalEntry[]>(
    () => dayQuery.data?.items ?? EMPTY_ENTRIES,
    [dayQuery.data],
  );

  const isInlineSearching = inlineSearch.trim().length > 0;

  const displayEntries = useMemo<JournalEntry[]>(() => {
    if (!isInlineSearching) return dayEntries;
    const query = inlineSearch.trim().toLowerCase();
    return dayEntries.filter(
      (entry) =>
        entry.title.toLowerCase().includes(query) ||
        entry.body.toLowerCase().includes(query) ||
        entry.tags.some((tag) => tag.toLowerCase().includes(query)),
    );
  }, [dayEntries, inlineSearch, isInlineSearching]);
  const isFirstLoad = dayQuery.isLoading && !dayQuery.isPlaceholderData;
  const hasEntries = dayEntries.length > 0;

  const handleDayPress = useCallback((dateString: string) => {
    setSelectedDate(dateString);
    setInlineSearch("");
  }, []);

  const handleEntryPress = useCallback(
    (id: string) => {
      router.push(`/entry/${id}`);
    },
    [router],
  );

  const handleCreatePress = useCallback(() => {
    const today = getTodayString();
    if (selectedDate < today) {
      router.push({ pathname: "/entry/create", params: { date: selectedDate } });
    } else {
      router.push("/entry/create");
    }
  }, [router, selectedDate]);

  const handleSearchPress = useCallback(() => {
    router.push("/entry/search");
  }, [router]);

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

  const searchButton = (
    <Pressable onPress={handleSearchPress} accessibilityLabel="Search entries">
      <Icon icon={Search} size="md" color={colors.accent} />
    </Pressable>
  );

  const listHeader = useMemo(
    () => (
      <View style={styles.listHeader}>
        <View style={styles.calendarWrapper}>
          <Calendar
            dayMap={calendarData.dayMap}
            streak={calendarData.streak}
            totalEntries={calendarData.totalEntries}
            selectedDate={selectedDate}
            onDayPress={handleDayPress}
          />
        </View>
        {hasEntries ? (
          <View style={styles.actionBarWrapper}>
            <DayActionBar
              selectedDate={selectedDate}
              searchValue={inlineSearch}
              onSearchChange={setInlineSearch}
              onAddReflection={handleCreatePress}
              showSearch={dayEntries.length >= DAY_SEARCH_THRESHOLD}
              searchPlaceholder={t("history.searchPlaceholder")}
            />
          </View>
        ) : null}
      </View>
    ),
    [
      calendarData.dayMap,
      calendarData.streak,
      calendarData.totalEntries,
      selectedDate,
      handleDayPress,
      hasEntries,
      dayEntries.length,
      inlineSearch,
      handleCreatePress,
      t,
    ],
  );

  const isPastDay = selectedDate < getTodayString();

  const emptyComponent = useMemo(
    () =>
      isFirstLoad ? (
        <View>
          {SKELETON_IDS.map((id) => (
            <View key={id} style={styles.cardWrapper}>
              <EntryCardSkeleton />
            </View>
          ))}
        </View>
      ) : (
        <Animated.View entering={FadeIn.duration(300)} style={styles.emptyContainer}>
          <EmptyState
            icon={Feather}
            title={
              isInlineSearching
                ? t("history.searchEmptyTitle")
                : t("history.dayEmptyTitle")
            }
            subtitle={
              isInlineSearching
                ? t("history.searchEmptySubtitle")
                : undefined
            }
            actionLabel={
              isInlineSearching
                ? undefined
                : isPastDay
                  ? t("history.pastDayEmptyAction")
                  : t("history.dayEmptySubtitle")
            }
            onAction={isInlineSearching ? undefined : handleCreatePress}
            variant="minimal"
          />
        </Animated.View>
      ),
    [isFirstLoad, isInlineSearching, isPastDay, t, handleCreatePress],
  );

  return (
    <View style={styles.root}>
      <Header title={t("tabs.history")} rightAction={searchButton} />
      <FlatList
        data={displayEntries}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={emptyComponent}
        contentContainerStyle={[
          styles.list,
          {
            paddingTop: headerHeight + spacing.sm,
            paddingBottom: insets.bottom + spacing.lg,
          },
          displayEntries.length === 0 && styles.emptyList,
        ]}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={ItemSeparator}
      />
    </View>
  );
}

function ItemSeparator() {
  return <View style={styles.separator} />;
}
