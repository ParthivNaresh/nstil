import { Redirect, Tabs } from "expo-router";
import { useTranslation } from "react-i18next";

import { LoadingScreen, TabBar } from "@/components/ui";
import { useProfile } from "@/hooks/useProfile";
import { useThemeSync } from "@/hooks/useThemeSync";

export default function TabLayout() {
  const { t } = useTranslation();
  const { data: profile, isLoading } = useProfile();

  useThemeSync(profile);

  if (isLoading) {
    return <LoadingScreen variant="loading" />;
  }

  if (profile && !profile.onboarding_completed_at) {
    return <Redirect href="/(onboarding)" />;
  }

  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: "transparent" } }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: t("tabs.home") }}
      />
      <Tabs.Screen
        name="history"
        options={{ title: t("tabs.history") }}
      />
      <Tabs.Screen
        name="create"
        options={{ title: t("tabs.create") }}
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
