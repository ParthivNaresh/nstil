import { useCallback } from "react";
import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";

import { compressImage } from "@/lib/imageUtils";
import type { LocalImage } from "@/types";

const MAX_SELECTION = 10;

export interface CompressionProgress {
  readonly completed: number;
  readonly total: number;
}

interface UseImagePickerOptions {
  readonly currentCount: number;
  readonly maxImages: number;
  readonly onProgress?: (progress: CompressionProgress) => void;
  readonly onImageReady?: (image: LocalImage) => void;
}

interface UseImagePickerReturn {
  readonly pickImages: () => Promise<void>;
}

export function useImagePicker({
  currentCount,
  maxImages,
  onProgress,
  onImageReady,
}: UseImagePickerOptions): UseImagePickerReturn {
  const pickImages = useCallback(async (): Promise<void> => {
    const remaining = maxImages - currentCount;
    if (remaining <= 0) return;

    const selectionLimit = Math.min(remaining, MAX_SELECTION);

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit,
      quality: 1,
      exif: false,
    });

    if (result.canceled || result.assets.length === 0) {
      return;
    }

    const validAssets = result.assets.filter((a) => a.width && a.height);
    const total = validAssets.length;

    if (total === 0) return;

    onProgress?.({ completed: 0, total });

    let completed = 0;

    for (const asset of validAssets) {
      try {
        const image = await compressImage(
          asset.uri,
          asset.width!,
          asset.height!,
          asset.fileName ?? undefined,
        );

        const localImage: LocalImage = {
          localId: `local_${Date.now()}_${completed}`,
          uri: image.uri,
          fileName: image.fileName,
          contentType: image.contentType,
          width: image.width,
          height: image.height,
        };

        onImageReady?.(localImage);
      } catch {
        Alert.alert("Image Error", "One or more images could not be processed.");
      }

      completed += 1;
      onProgress?.({ completed, total });
    }
  }, [currentCount, maxImages, onProgress, onImageReady]);

  return { pickImages };
}
