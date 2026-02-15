import { useRouter } from "expo-router";
import { Feather } from "lucide-react-native";
import { useCallback } from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";

import { EmptyState, Header } from "@/components/ui";
import { useHeaderHeight } from "@/hooks";
import { spacing } from "@/styles";

import { styles } from "./homeStyles";

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const headerHeight = useHeaderHeight();

  const handleCreatePress = useCallback(() => {
    router.push("/entry/create");
  }, [router]);

  return (
    <View style={styles.root}>
      <Header title={t("home.title")} />
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
