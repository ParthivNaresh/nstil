import * as Haptics from "expo-haptics";
import { Check, Pencil } from "lucide-react-native";
import { useCallback } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { useTheme } from "@/hooks/useTheme";
import type { SavedCustomTheme } from "@/stores/themeStore";
import { radius, spacing } from "@/styles";

interface CustomThemeCardProps {
  readonly theme: SavedCustomTheme;
  readonly isSelected: boolean;
  readonly onActivate: (id: string) => void;
  readonly onEdit: (theme: SavedCustomTheme) => void;
}

const PREVIEW_SIZE = 48;
const PREVIEW_INNER_WIDTH = 28;
const PREVIEW_INNER_HEIGHT = 30;
const CHECK_SIZE = 16;
const EDIT_SIZE = 12;
const TEXT_LINE_HEIGHT = 2;
const ACCENT_LINE_HEIGHT = 3;

export function CustomThemeCard({
  theme,
  isSelected,
  onActivate,
  onEdit,
}: CustomThemeCardProps) {
  const { colors } = useTheme();

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onActivate(theme.id);
  }, [theme.id, onActivate]);

  const handleEditPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onEdit(theme);
  }, [theme, onEdit]);

  const bg = theme.input.background;
  const surface = theme.built.palette.surface;
  const primary = theme.input.textPrimary;
  const secondary = theme.input.textSecondary;
  const accent = theme.input.accent;

  return (
    <Pressable
      onPress={handlePress}
      style={[
        styles.card,
        {
          borderColor: isSelected ? colors.accent : colors.glassBorder,
          backgroundColor: isSelected ? colors.accentMuted : colors.glass,
        },
      ]}
      accessibilityRole="radio"
      accessibilityState={{ selected: isSelected }}
      accessibilityLabel={theme.name}
    >
      <View style={styles.previewContainer}>
        <View style={[styles.preview, { backgroundColor: bg }]}>
          <View style={[styles.previewSurface, { backgroundColor: surface }]}>
            <View style={[styles.previewTextPrimary, { backgroundColor: primary }]} />
            <View style={[styles.previewTextSecondary, { backgroundColor: secondary }]} />
            <View style={[styles.previewAccent, { backgroundColor: accent }]} />
          </View>
        </View>
        <Pressable
          onPress={handleEditPress}
          hitSlop={8}
          style={[styles.editButton, { backgroundColor: colors.surfaceElevated }]}
        >
          <Pencil size={EDIT_SIZE} color={colors.textTertiary} />
        </Pressable>
      </View>

      <View style={styles.labelRow}>
        <AppText
          variant="caption"
          color={isSelected ? colors.accent : colors.textSecondary}
          numberOfLines={1}
          style={styles.labelText}
        >
          {theme.name}
        </AppText>
        {isSelected ? (
          <Check size={CHECK_SIZE} color={colors.accent} />
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    alignItems: "center",
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    gap: spacing.xs,
  },
  previewContainer: {
    position: "relative",
  },
  preview: {
    width: PREVIEW_SIZE,
    height: PREVIEW_SIZE,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  previewSurface: {
    width: PREVIEW_INNER_WIDTH,
    height: PREVIEW_INNER_HEIGHT,
    borderRadius: radius.xs,
    alignItems: "flex-start",
    justifyContent: "center",
    paddingHorizontal: 4,
    gap: 2,
  },
  previewTextPrimary: {
    width: "80%",
    height: TEXT_LINE_HEIGHT,
    borderRadius: radius.full,
  },
  previewTextSecondary: {
    width: "55%",
    height: TEXT_LINE_HEIGHT,
    borderRadius: radius.full,
    opacity: 0.6,
  },
  previewAccent: {
    width: "70%",
    height: ACCENT_LINE_HEIGHT,
    borderRadius: radius.full,
    marginTop: 1,
  },
  editButton: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    maxWidth: "100%",
    paddingHorizontal: spacing.xs,
  },
  labelText: {
    flexShrink: 1,
  },
});
