import { Image, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { useTheme } from "@/hooks/useTheme";
import { radius, spacing } from "@/styles";
import type { MediaPreview } from "@/types";

const THUMB_SIZE = 40;
const MAX_VISIBLE = 3;

interface MediaPreviewClusterProps {
  readonly preview: MediaPreview;
}

export function MediaPreviewCluster({ preview }: MediaPreviewClusterProps) {
  const { colors } = useTheme();
  const visibleItems = preview.items.slice(0, MAX_VISIBLE);
  const overflow = preview.total_count - visibleItems.length;

  if (visibleItems.length === 0) {
    return null;
  }

  const lastIndex = visibleItems.length - 1;

  return (
    <View style={styles.container}>
      {visibleItems.map((item, index) => (
        <View key={item.id} style={styles.thumbWrapper}>
          <Image
            source={{ uri: item.url }}
            style={[styles.thumb, { borderColor: colors.border }]}
            resizeMode="cover"
          />
          {index === lastIndex && overflow > 0 && (
            <View style={styles.overflowBadge}>
              <AppText variant="caption" color="#FFFFFF" style={styles.overflowText}>
                +{overflow}
              </AppText>
            </View>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexShrink: 0,
    gap: spacing.xs,
    alignItems: "flex-end",
  },
  thumbWrapper: {
    position: "relative",
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
  },
  overflowBadge: {
    position: "absolute",
    bottom: -2,
    right: -6,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: radius.full,
    paddingHorizontal: 4,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: "center",
  },
  overflowText: {
    fontSize: 10,
    lineHeight: 14,
  },
});
