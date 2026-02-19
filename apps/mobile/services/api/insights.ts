import type {
  AIInsight,
  AIInsightUpdate,
  CursorParams,
  InsightSource,
  InsightType,
  PaginatedResponse,
} from "@/types";

import { apiFetch } from "./client";

const INSIGHTS_PATH = "/api/v1/insights";

interface ListInsightsParams extends CursorParams {
  readonly type?: string;
  readonly status?: string;
  readonly source?: string;
}

interface CreateInsightPayload {
  readonly insight_type: InsightType;
  readonly title: string;
  readonly content: string;
  readonly source: InsightSource;
  readonly supporting_entry_ids?: string[];
  readonly confidence?: number | null;
  readonly period_start?: string | null;
  readonly period_end?: string | null;
  readonly metadata?: Record<string, unknown>;
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
  if (params?.source) {
    searchParams.set("source", params.source);
  }
  const query = searchParams.toString();
  const path = query ? `${INSIGHTS_PATH}?${query}` : INSIGHTS_PATH;
  return apiFetch<PaginatedResponse<AIInsight>>(path);
}

export function createInsight(
  data: CreateInsightPayload,
): Promise<AIInsight> {
  return apiFetch<AIInsight>(INSIGHTS_PATH, {
    method: "POST",
    body: JSON.stringify(data),
  });
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
