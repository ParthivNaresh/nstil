import { Check, X } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { Dimensions, Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import ColorPicker, {
  HueSlider,
  Panel1,
  Preview,
  Swatches,
} from "reanimated-color-picker";

import { AppText } from "@/components/ui/AppText";
import { Icon } from "@/components/ui/Icon";
import { useTheme } from "@/hooks/useTheme";
import { radius, spacing } from "@/styles";

import type { ColorPickerSheetProps } from "./types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const MODAL_MAX_WIDTH = 340;
const CARD_WIDTH = Math.min(SCREEN_WIDTH - spacing.lg * 2, MODAL_MAX_WIDTH);
const FADE_DURATION = 200;

const SWATCH_COLORS = [
  "#F87171", "#FB923C", "#FBBF24", "#34D399", "#38BDF8",
  "#8B6FF0", "#F472B6", "#FFFFFF", "#A0A0A0", "#000000",
];

interface ColorChangeResult {
  readonly hex: string;
}

export function ColorPickerSheet({
  visible,
  label,
  currentColor,
  onConfirm,
  onCancel,
}: ColorPickerSheetProps) {
  const { colors } = useTheme();
  const [draftColor, setDraftColor] = useState(currentColor);

  useEffect(() => {
    if (visible) {
      setDraftColor(currentColor);
    }
  }, [visible, currentColor]);

  const handleChangeJS = useCallback((result: ColorChangeResult) => {
    setDraftColor(result.hex);
  }, []);

  const handleConfirm = useCallback(() => {
    onConfirm(draftColor);
  }, [draftColor, onConfirm]);

  if (!visible) return null;

  return (
    <Modal
      visible
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <Animated.View
          entering={FadeIn.duration(FADE_DURATION)}
          exiting={FadeOut.duration(FADE_DURATION)}
          style={styles.backdrop}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
        </Animated.View>

        <Animated.View
          entering={FadeIn.duration(FADE_DURATION)}
          exiting={FadeOut.duration(FADE_DURATION)}
          style={[
            styles.card,
            {
              backgroundColor: colors.sheet,
              borderColor: colors.glassBorder,
            },
          ]}
        >
          <View style={styles.header}>
            <Pressable onPress={onCancel} hitSlop={12} accessibilityLabel="Cancel">
              <Icon icon={X} size="md" color={colors.textSecondary} />
            </Pressable>
            <AppText variant="h3">{label}</AppText>
            <Pressable onPress={handleConfirm} hitSlop={12} accessibilityLabel="Confirm color">
              <Icon icon={Check} size="md" color={colors.accent} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            bounces={false}
            contentContainerStyle={styles.scrollContent}
          >
            <ColorPicker
              value={currentColor}
              onCompleteJS={handleChangeJS}
              style={styles.picker}
            >
              <Preview hideInitialColor style={styles.preview} />
              <Panel1 style={styles.panel} />
              <HueSlider style={styles.slider} />
              <Swatches colors={SWATCH_COLORS} style={styles.swatches} />
            </ColorPicker>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  card: {
    width: CARD_WIDTH,
    maxHeight: "80%",
    borderRadius: radius["2xl"],
    borderWidth: 1,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  scrollContent: {
    gap: spacing.md,
  },
  picker: {
    gap: spacing.md,
  },
  preview: {
    height: 40,
    borderRadius: radius.md,
  },
  panel: {
    height: 180,
    borderRadius: radius.md,
  },
  slider: {
    height: 28,
    borderRadius: radius.sm,
  },
  swatches: {
    justifyContent: "center",
    gap: spacing.xs,
  },
});
