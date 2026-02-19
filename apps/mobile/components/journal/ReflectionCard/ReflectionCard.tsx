import { Sparkles, X } from "lucide-react-native";
import { useCallback, useState } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText, Card, Icon } from "@/components/ui";
import { useTheme } from "@/hooks";
import { spacing } from "@/styles";

export interface ReflectionCardProps {
  readonly content: string;
  readonly onDismiss: () => void;
  readonly isDismissing: boolean;
}

const FADE_DURATION_MS = 400;
const MAX_PREVIEW_LINES = 3;

export function ReflectionCard({
  content,
  onDismiss,
  isDismissing,
}: ReflectionCardProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState(false);

  const openModal = useCallback(() => setModalVisible(true), []);
  const closeModal = useCallback(() => setModalVisible(false), []);

  return (
    <>
      <Animated.View entering={FadeIn.duration(FADE_DURATION_MS)}>
        <Pressable onPress={openModal} accessibilityRole="button">
          <Card variant="glass" style={styles.card}>
            <View style={styles.header}>
              <View style={styles.labelRow}>
                <Icon icon={Sparkles} size="xs" color={colors.accent} />
                <AppText variant="caption" style={{ color: colors.accent }}>
                  AI Reflection
                </AppText>
              </View>
              <Pressable
                onPress={onDismiss}
                disabled={isDismissing}
                hitSlop={12}
                accessibilityLabel="Dismiss reflection"
              >
                <Icon icon={X} size="xs" color={colors.textTertiary} />
              </Pressable>
            </View>
            <AppText
              variant="bodySmall"
              style={{ color: colors.textSecondary }}
              numberOfLines={MAX_PREVIEW_LINES}
            >
              {content}
            </AppText>
          </Card>
        </Pressable>
      </Animated.View>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <View
          style={[
            styles.modalRoot,
            {
              backgroundColor: colors.background,
              paddingTop: insets.top + spacing.md,
              paddingBottom: insets.bottom + spacing.xl,
            },
          ]}
        >
          <View style={styles.modalHeader}>
            <View style={styles.labelRow}>
              <Icon icon={Sparkles} size="sm" color={colors.accent} />
              <AppText variant="h3" style={{ color: colors.textPrimary }}>
                AI Reflection
              </AppText>
            </View>
            <Pressable
              onPress={closeModal}
              hitSlop={12}
              accessibilityLabel="Close"
            >
              <Icon icon={X} size="sm" color={colors.textTertiary} />
            </Pressable>
          </View>
          <AppText
            variant="body"
            style={[styles.modalBody, { color: colors.textSecondary }]}
          >
            {content}
          </AppText>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.xs,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  modalRoot: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalBody: {
    paddingTop: spacing.lg,
    lineHeight: 24,
  },
});
