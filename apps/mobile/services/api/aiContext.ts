import type { AIContextResponse } from "@/types";

import { apiFetch } from "./client";

const CONTEXT_PATH = "/api/v1/ai/context";

interface FetchContextParams {
  readonly entryLimit?: number;
  readonly daysBack?: number;
}

export function fetchAIContext(
  params?: FetchContextParams,
): Promise<AIContextResponse> {
  const searchParams = new URLSearchParams();
  if (params?.entryLimit !== undefined) {
    searchParams.set("entry_limit", String(params.entryLimit));
  }
  if (params?.daysBack !== undefined) {
    searchParams.set("days_back", String(params.daysBack));
  }
  const query = searchParams.toString();
  const path = query ? `${CONTEXT_PATH}?${query}` : CONTEXT_PATH;
  return apiFetch<AIContextResponse>(path);
}
