import type {
  AIInsight,
  AIInsightUpdate,
  CursorParams,
  PaginatedResponse,
} from "@/types";

import { apiFetch } from "./client";

const INSIGHTS_PATH = "/api/v1/insights";

interface ListInsightsParams extends CursorParams {
  readonly type?: string;
  readonly status?: string;
}

export function listInsights(
  params?: ListInsightsParams,
): Promise<PaginatedResponse<AIInsight>> {
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
  const path = query ? `${INSIGHTS_PATH}?${query}` : INSIGHTS_PATH;
  return apiFetch<PaginatedResponse<AIInsight>>(path);
}

export function generateInsights(): Promise<AIInsight[]> {
  return apiFetch<AIInsight[]>(`${INSIGHTS_PATH}/generate`, {
    method: "POST",
  });
}

export function updateInsight(
  id: string,
  data: AIInsightUpdate,
): Promise<AIInsight> {
  return apiFetch<AIInsight>(`${INSIGHTS_PATH}/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}
