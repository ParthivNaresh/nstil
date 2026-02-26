import { useRouter } from "expo-router";
import { BookOpen, Plus } from "lucide-react-native";
import { useCallback } from "react";
import { FlatList, Pressable, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useTranslation } from "react-i18next";

import { JournalCard } from "@/components/journal";
import { EmptyState, Header, Icon } from "@/components/ui";
import { useHeaderHeight, useJournals, useTheme } from "@/hooks";
import { spacing } from "@/styles";
import type { JournalSpace } from "@/types";

import { styles } from "@/styles/screens/journalListStyles";

export default function JournalListScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const headerHeight = useHeaderHeight();
  const { data: journals = [], isLoading } = useJournals();

  const handleJournalPress = useCallback(
    (id: string) => {
      router.push(`/journal/${id}`);
    },
    [router],
  );

  const handleCreatePress = useCallback(() => {
    router.push("/journal/create");
  }, [router]);

  const renderItem = useCallback(
    ({ item }: { item: JournalSpace }) => (
      <JournalCard journal={item} onPress={handleJournalPress} />
    ),
    [handleJournalPress],
  );

  const keyExtractor = useCallback((item: JournalSpace) => item.id, []);

  const addButton = (
    <Pressable onPress={handleCreatePress} accessibilityLabel={t("journal.create.title")}>
      <Icon icon={Plus} size="md" color={colors.accent} />
    </Pressable>
  );

  const emptyComponent = isLoading ? null : (
    <Animated.View entering={FadeIn.duration(300)} style={styles.emptyContainer}>
      <EmptyState
        icon={BookOpen}
        title={t("journal.list.empty")}
        subtitle={t("journal.list.emptySubtitle")}
        actionLabel={t("journal.create.title")}
        onAction={handleCreatePress}
        variant="minimal"
      />
    </Animated.View>
  );

  return (
    <View style={styles.root}>
      <Header
        title={t("journal.list.title")}
        onBack={router.back}
        rightAction={addButton}
      />
      <FlatList
        data={journals}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListEmptyComponent={emptyComponent}
        contentContainerStyle={[
          styles.list,
          { paddingTop: headerHeight + spacing.sm },
          journals.length === 0 && styles.emptyList,
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
