import { useRouter } from "expo-router";
import { useCallback } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";

import { ThemePage } from "@/components/settings";
import { Header, ScreenContainer } from "@/components/ui";
import { useHeaderHeight, useTheme } from "@/hooks";
import { spacing } from "@/styles";

export default function ThemeScreen() {
  const { t } = useTranslation();
  const { mode, setMode } = useTheme();
  const router = useRouter();
  const headerHeight = useHeaderHeight();

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <ScreenContainer>
      <Header
        title={t("settings.theme")}
        onBack={handleBack}
      />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: headerHeight + spacing.md },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <ThemePage currentMode={mode} onSelect={setMode} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
});
