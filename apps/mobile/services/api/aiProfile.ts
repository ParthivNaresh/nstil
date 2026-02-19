import type { AIProfile, AIProfileUpdate } from "@/types";

import { apiFetch } from "./client";

const AI_PROFILE_PATH = "/api/v1/ai/profile";

export function getAIProfile(): Promise<AIProfile> {
  return apiFetch<AIProfile>(AI_PROFILE_PATH);
}

export function updateAIProfile(
  data: AIProfileUpdate,
): Promise<AIProfile> {
  return apiFetch<AIProfile>(AI_PROFILE_PATH, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}
