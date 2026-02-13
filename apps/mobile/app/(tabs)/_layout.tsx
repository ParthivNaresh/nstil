import { Tabs } from "expo-router";
import { useTranslation } from "react-i18next";

import { TabBar } from "@/components/ui";

export default function TabLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: t("tabs.journal") }}
      />
      <Tabs.Screen
        name="insights"
        options={{ title: t("tabs.insights") }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: t("tabs.settings") }}
      />
    </Tabs>
  );
}
