import { useCallback, useMemo, useState } from "react";

import { useImagePicker } from "@/hooks/useImagePicker";
import type { CompressionProgress } from "@/hooks/useImagePicker";
import { findExistingAudio } from "@/lib/audioMediaUtils";
import type { EntryMedia, LocalAudio, LocalImage } from "@/types";

import { MAX_IMAGES } from "./formUtils";
import type { EntryMediaState } from "./types";

export function useEntryMediaState(
  initialMedia: EntryMedia[],
): EntryMediaState {
  const [localImages, setLocalImages] = useState<LocalImage[]>([]);
  const [existingMedia] = useState<EntryMedia[]>(initialMedia);
  const [removedMediaIds, setRemovedMediaIds] = useState<Set<string>>(new Set());
  const [compressionProgress, setCompressionProgress] = useState<CompressionProgress | null>(null);
  const [localAudio, setLocalAudio] = useState<LocalAudio | null>(null);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);

  const existingAudio = useMemo(
    () => findExistingAudio(existingMedia, removedMediaIds),
    [existingMedia, removedMediaIds],
  );

  const visibleExistingCount = existingMedia.length - removedMediaIds.size;
  const totalImageCount = visibleExistingCount + localImages.length;

  const handleCompressionProgress = useCallback((progress: CompressionProgress) => {
    setCompressionProgress(progress);
  }, []);

  const handleImageReady = useCallback((image: LocalImage) => {
    setLocalImages((prev) => [...prev, image]);
  }, []);

  const { pickImages } = useImagePicker({
    currentCount: totalImageCount,
    maxImages: MAX_IMAGES,
    onProgress: handleCompressionProgress,
    onImageReady: handleImageReady,
  });

  const handlePickImages = useCallback(async () => {
    await pickImages();
    setCompressionProgress(null);
  }, [pickImages]);

  const removeLocalImage = useCallback((localId: string) => {
    setLocalImages((prev) => prev.filter((img) => img.localId !== localId));
  }, []);

  const removeExistingMedia = useCallback((mediaId: string) => {
    setRemovedMediaIds((prev) => new Set(prev).add(mediaId));
  }, []);

  const startRecording = useCallback(() => {
    setIsRecordingAudio(true);
  }, []);

  const stopRecording = useCallback(() => {
    setIsRecordingAudio(false);
  }, []);

  const recordAudio = useCallback((audio: LocalAudio) => {
    setLocalAudio(audio);
  }, []);

  const removeAudio = useCallback(() => {
    if (localAudio) {
      setLocalAudio(null);
      return;
    }
    if (existingAudio) {
      setRemovedMediaIds((prev) => new Set(prev).add(existingAudio.id));
    }
  }, [localAudio, existingAudio]);

  return {
    localImages,
    existingMedia,
    removedMediaIds,
    compressionProgress,
    localAudio,
    existingAudio,
    isRecordingAudio,
    handlePickImages,
    removeLocalImage,
    removeExistingMedia,
    startRecording,
    stopRecording,
    recordAudio,
    removeAudio,
  };
}
