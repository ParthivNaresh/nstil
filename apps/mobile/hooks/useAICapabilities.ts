import { useQuery } from "@tanstack/react-query";
import { Platform } from "react-native";

import { getAvailability } from "@/lib/ai/foundationModels";
import type { AIModelStatus } from "@/lib/ai/foundationModels";
import { queryKeys } from "@/lib/queryKeys";

export interface AICapabilities {
  readonly hasOnDeviceAI: boolean;
  readonly isDownloading: boolean;
  readonly status: AIModelStatus;
  readonly platform: "ios" | "android" | "none";
  readonly reason: string | null;
}

const STALE_TIME_MS = 5 * 60 * 1000;

const UNSUPPORTED_CAPABILITIES: AICapabilities = {
  hasOnDeviceAI: false,
  isDownloading: false,
  status: "notSupported",
  platform: "none",
  reason: "Platform not supported",
};

export function useAICapabilities(): AICapabilities {
  const { data } = useQuery({
    queryKey: queryKeys.ai.capabilities(),
    queryFn: getAvailability,
    staleTime: STALE_TIME_MS,
    enabled: Platform.OS === "ios",
  });

  if (Platform.OS !== "ios" || !data) {
    return UNSUPPORTED_CAPABILITIES;
  }

  return {
    hasOnDeviceAI: data.status === "available",
    isDownloading: data.status === "downloading",
    status: data.status,
    platform: "ios",
    reason: data.reason,
  };
}
