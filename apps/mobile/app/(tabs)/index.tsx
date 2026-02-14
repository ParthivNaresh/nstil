import { useRouter } from "expo-router";
import { Plus, Feather } from "lucide-react-native";
import { useCallback } from "react";
import { Pressable, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AmbientBackground, EmptyState, Header, Icon } from "@/components/ui";
import { useHeaderHeight, useTheme } from "@/hooks";
import { spacing } from "@/styles";

import { styles } from "./homeStyles";

export default function HomeScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const headerHeight = useHeaderHeight();

  const handleCreatePress = useCallback(() => {
    router.push("/entry/create");
  }, [router]);

  const createButton = (
    <Pressable onPress={handleCreatePress} accessibilityLabel="Create entry">
      <Icon icon={Plus} size="md" color={colors.accent} />
    </Pressable>
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <AmbientBackground />
      <Header title={t("home.title")} rightAction={createButton} />
      <View style={[styles.content, { paddingTop: headerHeight + spacing.xl }]}>
        <EmptyState
          icon={Feather}
          title="Welcome to NStil"
          subtitle="Your personal reflection companion"
          actionLabel={t("journal.emptyAction")}
          onAction={handleCreatePress}
        />
      </View>
    </View>
  );
}
