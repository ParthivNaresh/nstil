import * as Haptics from "expo-haptics";
import { useCallback } from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { Trash2 } from "lucide-react-native";

import { useTheme } from "@/hooks/useTheme";
import { radius } from "@/styles";

import type { ThumbnailSource } from "./types";

const THUMBNAIL_SIZE = 64;
const ICON_SIZE = 20;

interface ImageThumbnailProps {
  readonly source: ThumbnailSource;
  readonly showTrash: boolean;
  readonly onRemove: () => void;
  readonly onActivateTrash: () => void;
  readonly onDeactivateTrash: () => void;
}

export function ImageThumbnail({
  source,
  showTrash,
  onRemove,
  onActivateTrash,
  onDeactivateTrash,
}: ImageThumbnailProps) {
  const { colors } = useTheme();

  const handlePress = useCallback(() => {
    if (showTrash) {
      onRemove();
    } else {
      onDeactivateTrash();
    }
  }, [showTrash, onRemove, onDeactivateTrash]);

  const handleLongPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onActivateTrash();
  }, [onActivateTrash]);

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={handleLongPress}
      delayLongPress={300}
      style={styles.container}
    >
      <Image
        source={{ uri: source.uri }}
        style={[
          styles.image,
          { borderColor: colors.border },
        ]}
        resizeMode="cover"
      />
      {showTrash && (
        <Animated.View
          entering={FadeIn.duration(150)}
          exiting={FadeOut.duration(150)}
          style={styles.trashOverlay}
        >
          <View style={styles.trashBackground}>
            <Trash2 size={ICON_SIZE} color={colors.onError} />
          </View>
        </Animated.View>
      )}
    </Pressable>
  );
}

export { THUMBNAIL_SIZE };

const styles = StyleSheet.create({
  container: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    borderRadius: radius.sm,
    overflow: "hidden",
  },
  image: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
  },
  trashOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(220, 38, 38, 0.6)",
    borderRadius: radius.sm,
  },
  trashBackground: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: "rgba(220, 38, 38, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
});
