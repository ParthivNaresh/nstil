import type { EntryMedia } from "@/types";

const AUDIO_CONTENT_TYPES: ReadonlySet<string> = new Set([
  "audio/m4a",
  "audio/mp4",
  "audio/aac",
  "audio/wav",
  "audio/mpeg",
  "audio/x-m4a",
]);

export function isAudioContentType(contentType: string): boolean {
  return AUDIO_CONTENT_TYPES.has(contentType);
}

export function findExistingAudio(
  media: EntryMedia[],
  removedIds: ReadonlySet<string>,
): EntryMedia | null {
  return (
    media.find(
      (item) => isAudioContentType(item.content_type) && !removedIds.has(item.id),
    ) ?? null
  );
}

export function filterImageMedia(
  media: EntryMedia[],
): EntryMedia[] {
  return media.filter((item) => !isAudioContentType(item.content_type));
}
