import type { Profile, ProfileUpdate } from "@/types";

import { apiFetch } from "./client";

const PROFILE_PATH = "/api/v1/profile";

export function getProfile(): Promise<Profile> {
  return apiFetch<Profile>(PROFILE_PATH);
}

export function updateProfile(data: ProfileUpdate): Promise<Profile> {
  return apiFetch<Profile>(PROFILE_PATH, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function completeOnboarding(): Promise<Profile> {
  return apiFetch<Profile>(`${PROFILE_PATH}/onboarding-complete`, {
    method: "POST",
  });
}
