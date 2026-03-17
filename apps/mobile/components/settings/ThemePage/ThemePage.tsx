import { useCallback, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { CustomThemeModal } from "@/components/settings/CustomThemeEditor";
import { ThemeModeCard } from "@/components/settings/ThemePicker/ThemeModeCard";
import type { ThemeModeOption } from "@/components/settings/ThemePicker/types";
import { THEME_MODE_OPTIONS } from "@/components/settings/ThemePicker/themeModes";
import { useTheme } from "@/hooks/useTheme";
import type { CustomThemeInput } from "@/lib/themeBuilder";
import { MAX_CUSTOM_THEMES } from "@/stores/themeStore";
import type { SavedCustomTheme } from "@/stores/themeStore";
import { PRESET_THEMES } from "@/styles/presetPalettes";
import { spacing } from "@/styles";

import { CustomThemeCard } from "./CustomThemeCard";
import { NewThemeCard } from "./NewThemeCard";
import { ThemeSection } from "./ThemeSection";
import type { ThemePageProps } from "./types";

const GRID_COLUMNS = 4;

function buildPresetOptions(): readonly ThemeModeOption[] {
  return PRESET_THEMES.map((preset) => ({
    value: preset.id,
    labelKey: preset.labelKey,
    previewColors: [
      preset.palette.background,
      preset.palette.surface,
      preset.palette.textPrimary,
      preset.palette.textSecondary,
      preset.palette.accent,
    ] as const,
  }));
}

function GridSpacer() {
  return <View style={styles.spacer} />;
}

export function ThemePage({ currentMode, onSelect }: ThemePageProps) {
  const { t } = useTranslation();
  const {
    customThemes,
    activeCustomId,
    saveCustomTheme,
    updateCustomTheme,
    deleteCustomTheme,
    activateCustomTheme,
  } = useTheme();
  const presetOptions = useMemo(buildPresetOptions, []);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTheme, setEditingTheme] = useState<SavedCustomTheme | null>(null);

  const isMaxReached = customThemes.length >= MAX_CUSTOM_THEMES;
  const customItemCount = (isMaxReached ? 0 : 1) + customThemes.length;
  const spacerCount = Math.max(0, GRID_COLUMNS - customItemCount);

  const handleNewTheme = useCallback(() => {
    setEditingTheme(null);
    setModalVisible(true);
  }, []);

  const handleEditTheme = useCallback((theme: SavedCustomTheme) => {
    setEditingTheme(theme);
    setModalVisible(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setModalVisible(false);
    setEditingTheme(null);
  }, []);

  const handleModalSave = useCallback(
    (name: string, input: CustomThemeInput) => {
      saveCustomTheme(name, input);
      setModalVisible(false);
      setEditingTheme(null);
    },
    [saveCustomTheme],
  );

  const handleModalUpdate = useCallback(
    (id: string, name: string, input: CustomThemeInput) => {
      updateCustomTheme(id, name, input);
      setModalVisible(false);
      setEditingTheme(null);
    },
    [updateCustomTheme],
  );

  const handleActivate = useCallback(
    (id: string) => {
      activateCustomTheme(id);
    },
    [activateCustomTheme],
  );

  const handleDelete = useCallback(
    (id: string) => {
      deleteCustomTheme(id);
      setModalVisible(false);
      setEditingTheme(null);
    },
    [deleteCustomTheme],
  );

  const isCustomMode = currentMode === "custom";

  return (
    <View style={styles.container}>
      <ThemeSection title={t("settings.themeSections.standard")}>
        {THEME_MODE_OPTIONS.map((option) => (
          <ThemeModeCard
            key={option.value}
            option={option}
            isSelected={currentMode === option.value}
            onSelect={onSelect}
          />
        ))}
      </ThemeSection>

      <ThemeSection title={t("settings.themeSections.presets")}>
        {presetOptions.map((option) => (
          <ThemeModeCard
            key={option.value}
            option={option}
            isSelected={currentMode === option.value}
            onSelect={onSelect}
          />
        ))}
      </ThemeSection>

      <ThemeSection title={t("settings.themeSections.custom")}>
        {!isMaxReached ? (
          <NewThemeCard onPress={handleNewTheme} disabled={false} />
        ) : null}
        {customThemes.map((theme) => (
          <CustomThemeCard
            key={theme.id}
            theme={theme}
            isSelected={isCustomMode && activeCustomId === theme.id}
            onActivate={handleActivate}
            onEdit={handleEditTheme}
          />
        ))}
        {Array.from({ length: spacerCount }, (_, i) => (
          <GridSpacer key={`spacer-${i}`} />
        ))}
      </ThemeSection>

      <CustomThemeModal
        visible={modalVisible}
        editingTheme={editingTheme}
        onSave={handleModalSave}
        onUpdate={handleModalUpdate}
        onDelete={handleDelete}
        onClose={handleModalClose}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xl,
  },
  spacer: {
    flex: 1,
  },
});
