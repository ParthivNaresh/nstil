import type {
  AIPrompt,
  AIPromptUpdate,
  CursorParams,
  GeneratePromptRequest,
  MoodCategory,
  PaginatedResponse,
  PromptSource,
  PromptType,
} from "@/types";

import { apiFetch } from "./client";

const PROMPTS_PATH = "/api/v1/ai/prompts";

interface CreatePromptPayload {
  readonly prompt_type: PromptType;
  readonly content: string;
  readonly source: PromptSource;
  readonly mood_category?: MoodCategory | null;
  readonly session_id?: string;
  readonly entry_id?: string;
  readonly context?: Record<string, unknown>;
}

interface ListPromptsParams extends CursorParams {
  readonly type?: string;
  readonly status?: string;
}

export function listPrompts(
  params?: ListPromptsParams,
): Promise<PaginatedResponse<AIPrompt>> {
  const searchParams = new URLSearchParams();
  if (params?.cursor) {
    searchParams.set("cursor", params.cursor);
  }
  if (params?.limit !== undefined) {
    searchParams.set("limit", String(params.limit));
  }
  if (params?.type) {
    searchParams.set("type", params.type);
  }
  if (params?.status) {
    searchParams.set("status", params.status);
  }
  const query = searchParams.toString();
  const path = query ? `${PROMPTS_PATH}?${query}` : PROMPTS_PATH;
  return apiFetch<PaginatedResponse<AIPrompt>>(path);
}

export function createPrompt(
  data: CreatePromptPayload,
): Promise<AIPrompt> {
  return apiFetch<AIPrompt>(PROMPTS_PATH, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function generatePrompt(
  data?: GeneratePromptRequest,
): Promise<AIPrompt> {
  return apiFetch<AIPrompt>(`${PROMPTS_PATH}/generate`, {
    method: "POST",
    body: JSON.stringify(data ?? {}),
  });
}

export function getEntryReflection(
  entryId: string,
  promptType?: string,
): Promise<AIPrompt | null> {
  const searchParams = new URLSearchParams();
  if (promptType) {
    searchParams.set("type", promptType);
  }
  const query = searchParams.toString();
  const path = query
    ? `${PROMPTS_PATH}/entry/${entryId}?${query}`
    : `${PROMPTS_PATH}/entry/${entryId}`;
  return apiFetch<AIPrompt | null>(path);
}

export function updatePrompt(
  id: string,
  data: AIPromptUpdate,
): Promise<AIPrompt> {
  return apiFetch<AIPrompt>(`${PROMPTS_PATH}/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}
