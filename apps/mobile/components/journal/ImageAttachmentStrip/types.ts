import type { CompressionProgress } from "@/hooks/useImagePicker";
import type { EntryMedia, LocalImage } from "@/types";

export interface ImageAttachmentStripProps {
  readonly localImages: LocalImage[];
  readonly existingMedia: EntryMedia[];
  readonly removedMediaIds: ReadonlySet<string>;
  readonly compressionProgress: CompressionProgress | null;
  readonly onPickImages: () => void;
  readonly onRemoveLocal: (localId: string) => void;
  readonly onRemoveExisting: (mediaId: string) => void;
  readonly maxImages: number;
}

export type ThumbnailSource =
  | { readonly kind: "local"; readonly localId: string; readonly uri: string }
  | { readonly kind: "existing"; readonly mediaId: string; readonly uri: string };
