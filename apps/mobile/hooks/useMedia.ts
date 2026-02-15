import { queryKeys } from "@/lib/queryKeys";
import {
  deleteMedia,
  listMedia,
  uploadMedia,
} from "@/services/api/media";
import type { UploadMediaParams } from "@/services/api/media";
import type { EntryMedia, EntryMediaListResponse } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useEntryMedia(entryId: string) {
  return useQuery<EntryMediaListResponse>({
    queryKey: queryKeys.media.list(entryId),
    queryFn: () => listMedia(entryId),
    enabled: !!entryId,
  });
}

export function useUploadMedia(entryId: string) {
  const queryClient = useQueryClient();

  return useMutation<EntryMedia, Error, Omit<UploadMediaParams, "entryId">>({
    mutationFn: (params) => uploadMedia({ ...params, entryId }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.media.list(entryId),
      });
    },
  });
}

export function useDeleteMedia(entryId: string) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (mediaId) => deleteMedia(entryId, mediaId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.media.list(entryId),
      });
    },
  });
}
