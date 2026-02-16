import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { spacing } from "@/styles";

import { AddImageButton } from "./AddImageButton";
import { CompressionIndicator } from "./CompressionIndicator";
import { ImageThumbnail } from "./ImageThumbnail";
import type { ImageAttachmentStripProps, ThumbnailSource } from "./types";

function getThumbnailId(source: ThumbnailSource): string {
  return source.kind === "local" ? source.localId : source.mediaId;
}

export function ImageAttachmentStrip({
  localImages,
  existingMedia,
  removedMediaIds,
  compressionProgress,
  onPickImages,
  onRemoveLocal,
  onRemoveExisting,
  maxImages,
}: ImageAttachmentStripProps) {
  const [trashTargetId, setTrashTargetId] = useState<string | null>(null);

  const clearTrash = useCallback(() => {
    setTrashTargetId(null);
  }, []);

  const visibleExisting = useMemo(
    () => existingMedia.filter((m) => !removedMediaIds.has(m.id)),
    [existingMedia, removedMediaIds],
  );

  const thumbnails: ThumbnailSource[] = useMemo(() => {
    const existing: ThumbnailSource[] = visibleExisting.map((m) => ({
      kind: "existing",
      mediaId: m.id,
      uri: m.url,
    }));
    const local: ThumbnailSource[] = localImages.map((img) => ({
      kind: "local",
      localId: img.localId,
      uri: img.uri,
    }));
    return [...existing, ...local];
  }, [visibleExisting, localImages]);

  const totalCount = thumbnails.length;
  const atLimit = totalCount >= maxImages;
  const isCompressing =
    compressionProgress !== null &&
    compressionProgress.completed < compressionProgress.total;

  const handleRemove = useCallback(
    (source: ThumbnailSource) => {
      if (source.kind === "local") {
        onRemoveLocal(source.localId);
      } else {
        onRemoveExisting(source.mediaId);
      }
      setTrashTargetId(null);
    },
    [onRemoveLocal, onRemoveExisting],
  );

  if (totalCount === 0 && !isCompressing) {
    return <AddImageButton onPress={onPickImages} compact={false} />;
  }

  return (
    <Pressable style={styles.wrapper} onPress={clearTrash}>
      {totalCount > 0 && (
        <View style={styles.container}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            style={atLimit ? styles.scrollFull : styles.scrollWithButton}
            onScrollBeginDrag={clearTrash}
          >
            {thumbnails.map((source) => {
              const id = getThumbnailId(source);
              return (
                <ImageThumbnail
                  key={id}
                  source={source}
                  showTrash={trashTargetId === id}
                  onRemove={() => handleRemove(source)}
                  onActivateTrash={() => setTrashTargetId(id)}
                  onDeactivateTrash={clearTrash}
                />
              );
            })}
          </ScrollView>
          {!atLimit && !isCompressing && (
            <AddImageButton onPress={onPickImages} compact />
          )}
        </View>
      )}
      {isCompressing && compressionProgress && (
        <CompressionIndicator progress={compressionProgress} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.sm,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  scrollContent: {
    gap: spacing.xs,
    alignItems: "center",
  },
  scrollWithButton: {
    flex: 1,
  },
  scrollFull: {
    flex: 1,
  },
});
