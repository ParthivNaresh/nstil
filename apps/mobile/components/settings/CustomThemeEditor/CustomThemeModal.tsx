import { Trash2, X } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { AppText, Button, Icon, TextInput } from "@/components/ui";
import { useTheme } from "@/hooks/useTheme";
import { normalizedToHex, rgbaToHex } from "@/lib/colorUtils";
import type { CustomThemeInput } from "@/lib/themeBuilder";
import type { AmbientColorSet } from "@/components/ui/AmbientBackground/ambientColors";
import { getAmbientColors } from "@/components/ui/AmbientBackground/ambientColors";
import type { ColorPalette } from "@/styles/palettes";
import type { SavedCustomTheme } from "@/stores/themeStore";
import { useThemeStore } from "@/stores/themeStore";
import { spacing } from "@/styles";

import { CustomThemeEditor } from "./CustomThemeEditor";
import type { ColorFieldKey } from "./types";

interface CustomThemeModalProps {
  readonly visible: boolean;
  readonly editingTheme: SavedCustomTheme | null;
  readonly onSave: (name: string, input: CustomThemeInput) => void;
  readonly onUpdate: (id: string, name: string, input: CustomThemeInput) => void;
  readonly onDelete: (id: string) => void;
  readonly onClose: () => void;
}

function getPreFillInput(colors: ColorPalette, ambient: AmbientColorSet): CustomThemeInput {
  return {
    background: rgbaToHex(colors.background),
    cardColor: rgbaToHex(colors.surface),
    textPrimary: rgbaToHex(colors.textPrimary),
    textSecondary: rgbaToHex(colors.textSecondary),
    accent: rgbaToHex(colors.accent),
    gradient1: normalizedToHex(ambient.color1),
    gradient2: normalizedToHex(ambient.color2),
    gradient3: normalizedToHex(ambient.color3),
  };
}

export function CustomThemeModal({
  visible,
  editingTheme,
  onSave,
  onUpdate,
  onDelete,
  onClose,
}: CustomThemeModalProps) {
  const { t } = useTranslation();
  const { colors, mode, isDark } = useTheme();
  const customThemes = useThemeStore((s) => s.customThemes);
  const activeCustomId = useThemeStore((s) => s.activeCustomId);
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [draft, setDraft] = useState<CustomThemeInput>(() => {
    const activeCustom = activeCustomId ? customThemes.find((t) => t.id === activeCustomId) : null;
    const ambient = mode === "custom" && activeCustom
      ? activeCustom.built.ambient
      : getAmbientColors(mode, isDark);
    return getPreFillInput(colors, ambient);
  });

  const isEditing = editingTheme !== null;

  useEffect(() => {
    if (visible) {
      if (editingTheme) {
        setDraft(editingTheme.input);
      } else {
        const activeCustom = activeCustomId ? customThemes.find((t) => t.id === activeCustomId) : null;
        const ambient = mode === "custom" && activeCustom
          ? activeCustom.built.ambient
          : getAmbientColors(mode, isDark);
        setDraft(getPreFillInput(colors, ambient));
      }
      setName(editingTheme ? editingTheme.name : "");
    }
  }, [visible, editingTheme, colors, mode, isDark, customThemes, activeCustomId]);

  const handleInputChange = useCallback((key: ColorFieldKey, value: string) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = useCallback(() => {
    const trimmedName = name.trim() || t("settings.customTheme.defaultName");
    if (isEditing && editingTheme) {
      onUpdate(editingTheme.id, trimmedName, draft);
    } else {
      onSave(trimmedName, draft);
    }
  }, [name, draft, isEditing, editingTheme, onSave, onUpdate, t]);

  const handleDelete = useCallback(() => {
    if (!editingTheme) return;
    Alert.alert(
      t("settings.customTheme.deleteTitle"),
      t("settings.customTheme.deleteMessage"),
      [
        { text: t("settings.customTheme.deleteCancel"), style: "cancel" },
        {
          text: t("settings.customTheme.deleteConfirm"),
          style: "destructive",
          onPress: () => onDelete(editingTheme.id),
        },
      ],
    );
  }, [editingTheme, onDelete, t]);

  const title = isEditing
    ? t("settings.customTheme.editTheme")
    : t("settings.customTheme.newTheme");

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.surface }]}>
        <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
          <Pressable onPress={onClose} hitSlop={12} accessibilityLabel="Close">
            <Icon icon={X} size="md" color={colors.textSecondary} />
          </Pressable>
          <AppText variant="h3">{title}</AppText>
          {isEditing ? (
            <Pressable onPress={handleDelete} hitSlop={12} accessibilityLabel={t("settings.customTheme.deleteConfirm")}>
              <Icon icon={Trash2} size="md" color={colors.error} />
            </Pressable>
          ) : (
            <View style={styles.headerSpacer} />
          )}
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <TextInput
            label={t("settings.customTheme.nameLabel")}
            value={name}
            onChangeText={setName}
            variant="flat"
          />
          <CustomThemeEditor input={draft} onInputChange={handleInputChange} />
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md, borderTopColor: colors.border }]}>
          <Button
            title={t("settings.customTheme.saveTheme")}
            onPress={handleSave}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerSpacer: {
    width: 24,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.lg,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
});
