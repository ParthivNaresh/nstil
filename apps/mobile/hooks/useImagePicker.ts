import { useCallback } from "react";
import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";

import { compressImage } from "@/lib/imageUtils";
import type { LocalImage } from "@/types";

const MAX_SELECTION = 10;

interface UseImagePickerOptions {
  readonly currentCount: number;
  readonly maxImages: number;
}

interface UseImagePickerReturn {
  readonly pickImages: () => Promise<LocalImage[]>;
}

export function useImagePicker({
  currentCount,
  maxImages,
}: UseImagePickerOptions): UseImagePickerReturn {
  const pickImages = useCallback(async (): Promise<LocalImage[]> => {
    const remaining = maxImages - currentCount;
    if (remaining <= 0) return [];

    const selectionLimit = Math.min(remaining, MAX_SELECTION);

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit,
      quality: 1,
      exif: false,
    });

    if (result.canceled || result.assets.length === 0) {
      return [];
    }

    const compressed: LocalImage[] = [];

    for (const asset of result.assets) {
      if (!asset.width || !asset.height) continue;

      try {
        const image = await compressImage(
          asset.uri,
          asset.width,
          asset.height,
          asset.fileName ?? undefined,
        );

        compressed.push({
          localId: `local_${Date.now()}_${compressed.length}`,
          uri: image.uri,
          fileName: image.fileName,
          contentType: image.contentType,
          width: image.width,
          height: image.height,
        });
      } catch {
        Alert.alert("Image Error", "One or more images could not be processed.");
      }
    }

    return compressed;
  }, [currentCount, maxImages]);

  return { pickImages };
}
