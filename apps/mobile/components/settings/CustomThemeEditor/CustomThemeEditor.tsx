import { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { spacing } from "@/styles";

import { ColorPickerSheet } from "./ColorPickerSheet";
import { ColorRow } from "./ColorRow";
import { ColorSection } from "./ColorSection";
import type { ColorFieldKey, CustomThemeEditorProps } from "./types";

interface ActivePicker {
  readonly key: ColorFieldKey;
  readonly label: string;
}

const FIELD_CONFIG: readonly { readonly key: ColorFieldKey; readonly section: string; readonly labelKey: string }[] = [
  { key: "background", section: "surfaces", labelKey: "settings.customTheme.background" },
  { key: "cardColor", section: "surfaces", labelKey: "settings.customTheme.cardColor" },
  { key: "textPrimary", section: "text", labelKey: "settings.customTheme.primary" },
  { key: "textSecondary", section: "text", labelKey: "settings.customTheme.secondary" },
  { key: "accent", section: "accent", labelKey: "settings.customTheme.accent" },
  { key: "gradient1", section: "gradient", labelKey: "settings.customTheme.gradientBase" },
  { key: "gradient2", section: "gradient", labelKey: "settings.customTheme.gradientPrimary" },
  { key: "gradient3", section: "gradient", labelKey: "settings.customTheme.gradientSecondary" },
];

export function CustomThemeEditor({ input, onInputChange }: CustomThemeEditorProps) {
  const { t } = useTranslation();
  const [activePicker, setActivePicker] = useState<ActivePicker | null>(null);

  const handleRowPress = useCallback((key: ColorFieldKey, label: string) => {
    setActivePicker({ key, label });
  }, []);

  const handleConfirm = useCallback(
    (color: string) => {
      if (activePicker) {
        onInputChange(activePicker.key, color);
      }
      setActivePicker(null);
    },
    [activePicker, onInputChange],
  );

  const handleCancel = useCallback(() => {
    setActivePicker(null);
  }, []);

  const surfaceFields = FIELD_CONFIG.filter((f) => f.section === "surfaces");
  const textFields = FIELD_CONFIG.filter((f) => f.section === "text");
  const accentFields = FIELD_CONFIG.filter((f) => f.section === "accent");
  const gradientFields = FIELD_CONFIG.filter((f) => f.section === "gradient");

  return (
    <View style={styles.container}>
      <ColorSection title={t("settings.customTheme.surfaceSection")}>
        {surfaceFields.map((field) => (
          <ColorRow
            key={field.key}
            label={t(field.labelKey)}
            color={input[field.key]}
            onPress={() => handleRowPress(field.key, t(field.labelKey))}
          />
        ))}
      </ColorSection>

      <ColorSection title={t("settings.customTheme.textSection")}>
        {textFields.map((field) => (
          <ColorRow
            key={field.key}
            label={t(field.labelKey)}
            color={input[field.key]}
            onPress={() => handleRowPress(field.key, t(field.labelKey))}
          />
        ))}
      </ColorSection>

      <ColorSection title={t("settings.customTheme.accentSection")}>
        {accentFields.map((field) => (
          <ColorRow
            key={field.key}
            label={t(field.labelKey)}
            color={input[field.key]}
            onPress={() => handleRowPress(field.key, t(field.labelKey))}
          />
        ))}
      </ColorSection>

      <ColorSection title={t("settings.customTheme.gradientSection")}>
        {gradientFields.map((field) => (
          <ColorRow
            key={field.key}
            label={t(field.labelKey)}
            color={input[field.key]}
            onPress={() => handleRowPress(field.key, t(field.labelKey))}
          />
        ))}
      </ColorSection>

      <ColorPickerSheet
        visible={activePicker !== null}
        label={activePicker?.label ?? ""}
        currentColor={activePicker ? input[activePicker.key] : "#000000"}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
});
