import { BlurView } from "expo-blur";
import { ChevronLeft } from "lucide-react-native";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@/components/ui/AppText";
import { Icon } from "@/components/ui/Icon";
import { useTheme } from "@/hooks/useTheme";
import { spacing } from "@/styles";

import type { HeaderProps } from "./types";

export const HEADER_ROW_HEIGHT = 44;
const BACK_HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 };

export function Header({
  title,
  onBack,
  rightAction,
  transparent = false,
}: HeaderProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const content = (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.row}>
        <View style={styles.left}>
          {onBack ? (
            <Pressable
              onPress={onBack}
              hitSlop={BACK_HIT_SLOP}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Icon icon={ChevronLeft} size="lg" color={colors.textPrimary} />
            </Pressable>
          ) : null}
        </View>

        <View style={styles.center}>
          <AppText variant="h3" align="center" numberOfLines={1}>
            {title}
          </AppText>
        </View>

        <View style={styles.right}>{rightAction}</View>
      </View>
    </View>
  );

  if (transparent) {
    return content;
  }

  return (
    <BlurView intensity={40} tint={isDark ? "dark" : "light"} style={styles.blur}>
      {content}
      <View style={[styles.borderBottom, { backgroundColor: colors.border }]} />
    </BlurView>
  );
}

const styles = StyleSheet.create({
  blur: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  container: {
    paddingHorizontal: spacing.md,
  },
  row: {
    height: HEADER_ROW_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
  },
  left: {
    width: 44,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  center: {
    flex: 1,
  },
  right: {
    minWidth: 44,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  borderBottom: {
    height: 1,
  },
});
