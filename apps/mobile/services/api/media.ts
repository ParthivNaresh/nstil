import type { EntryMedia, EntryMediaListResponse } from "@/types";

import { apiFetch, apiUpload } from "./client";

function mediaPath(entryId: string): string {
  return `/api/v1/entries/${entryId}/media`;
}

export interface UploadMediaParams {
  readonly entryId: string;
  readonly uri: string;
  readonly fileName: string;
  readonly contentType: string;
}

export function uploadMedia({
  entryId,
  uri,
  fileName,
  contentType,
}: UploadMediaParams): Promise<EntryMedia> {
  const formData = new FormData();
  formData.append("file", {
    uri,
    name: fileName,
    type: contentType,
  } as unknown as Blob);

  return apiUpload<EntryMedia>(mediaPath(entryId), formData);
}

export function listMedia(entryId: string): Promise<EntryMediaListResponse> {
  return apiFetch<EntryMediaListResponse>(mediaPath(entryId));
}

export function deleteMedia(entryId: string, mediaId: string): Promise<void> {
  return apiFetch<void>(`${mediaPath(entryId)}/${mediaId}`, {
    method: "DELETE",
  });
}
