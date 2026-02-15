import { manipulateAsync, SaveFormat } from "expo-image-manipulator";

const MAX_DIMENSION = 2048;
const JPEG_QUALITY = 0.8;

export interface CompressedImage {
  readonly uri: string;
  readonly width: number;
  readonly height: number;
  readonly fileName: string;
  readonly contentType: string;
}

export async function compressImage(
  uri: string,
  originalWidth: number,
  originalHeight: number,
  originalFileName?: string,
): Promise<CompressedImage> {
  const needsResize = originalWidth > MAX_DIMENSION || originalHeight > MAX_DIMENSION;

  const actions = needsResize
    ? [{ resize: computeResizeDimensions(originalWidth, originalHeight) }]
    : [];

  const result = await manipulateAsync(uri, actions, {
    compress: JPEG_QUALITY,
    format: SaveFormat.JPEG,
  });

  const fileName = deriveFileName(originalFileName);

  return {
    uri: result.uri,
    width: result.width,
    height: result.height,
    fileName,
    contentType: "image/jpeg",
  };
}

function computeResizeDimensions(
  width: number,
  height: number,
): { width: number } | { height: number } {
  if (width >= height) {
    return { width: MAX_DIMENSION };
  }
  return { height: MAX_DIMENSION };
}

function deriveFileName(original?: string): string {
  if (!original) {
    return `photo_${Date.now()}.jpg`;
  }
  const dotIndex = original.lastIndexOf(".");
  const baseName = dotIndex > 0 ? original.slice(0, dotIndex) : original;
  return `${baseName}.jpg`;
}
