import { useCallback, useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { spacing } from "@/styles";

import { AddImageButton } from "./AddImageButton";
import { ImageThumbnail } from "./ImageThumbnail";
import type { ImageAttachmentStripProps, ThumbnailSource } from "./types";

function getThumbnailId(source: ThumbnailSource): string {
  return source.kind === "local" ? source.localId : source.mediaId;
}

export function ImageAttachmentStrip({
  localImages,
  existingMedia,
  removedMediaIds,
  onPickImages,
  onRemoveLocal,
  onRemoveExisting,
  maxImages,
}: ImageAttachmentStripProps) {
  const [trashTargetId, setTrashTargetId] = useState<string | null>(null);

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

  if (totalCount === 0) {
    return <AddImageButton onPress={onPickImages} compact={false} />;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={atLimit ? styles.scrollFull : styles.scrollWithButton}
      >
        {thumbnails.map((source) => {
          const id = getThumbnailId(source);
          return (
            <ImageThumbnail
              key={id}
              source={source}
              showTrash={trashTargetId === id}
              onRemove={() => handleRemove(source)}
              onDismissTrash={() => setTrashTargetId(id)}
            />
          );
        })}
      </ScrollView>
      {!atLimit && (
        <AddImageButton onPress={onPickImages} compact />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
