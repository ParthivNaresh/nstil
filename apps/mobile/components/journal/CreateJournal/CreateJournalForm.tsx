import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppText, Divider, TextArea, TextInput } from "@/components/ui";
import { useTheme } from "@/hooks/useTheme";
import { spacing } from "@/styles";

import { ColorPicker } from "./ColorPicker";
import type { CreateJournalFormProps } from "./types";

const DESCRIPTION_MIN_HEIGHT = 80;
const DESCRIPTION_MAX_HEIGHT = 200;
const DESCRIPTION_MAX_LENGTH = 500;

export function CreateJournalForm({
  name,
  nameError,
  description,
  color,
  onNameChange,
  onDescriptionChange,
  onColorChange,
}: CreateJournalFormProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <View style={localStyles.container}>
      <TextInput
        label={t("journal.create.namePlaceholder")}
        value={name}
        onChangeText={onNameChange}
        error={nameError ? t(nameError) : undefined}
        variant="flat"
        autoCapitalize="sentences"
        returnKeyType="next"
      />

      <Divider color={colors.border} />

      <View style={localStyles.section}>
        <AppText variant="label" color={colors.textSecondary}>
          {t("journal.create.color")}
        </AppText>
        <ColorPicker selectedColor={color} onSelect={onColorChange} />
      </View>

      <Divider color={colors.border} />

      <TextArea
        label={t("journal.create.description")}
        value={description}
        onChangeText={onDescriptionChange}
        variant="flat"
        showCount
        maxLength={DESCRIPTION_MAX_LENGTH}
        minHeight={DESCRIPTION_MIN_HEIGHT}
        maxHeight={DESCRIPTION_MAX_HEIGHT}
        placeholder={t("journal.create.descriptionPlaceholder")}
      />
    </View>
  );
}

const localStyles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  section: {
    gap: spacing.sm,
  },
});
