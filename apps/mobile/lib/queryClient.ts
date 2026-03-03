import { QueryClient } from "@tanstack/react-query";

import { ApiError } from "@/services/api/errors";

const DEFAULT_RETRY_DELAY_MS = 1000;
const RATE_LIMIT_FALLBACK_DELAY_MS = 5000;

function shouldRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError && error.isRateLimited) {
    return failureCount < 2;
  }
  return failureCount < 1;
}

function computeRetryDelay(_attempt: number, error: unknown): number {
  if (error instanceof ApiError && error.isRateLimited) {
    const retryAfter = error.retryAfter;
    if (retryAfter !== null && retryAfter > 0) {
      return retryAfter * 1000;
    }
    return RATE_LIMIT_FALLBACK_DELAY_MS;
  }
  return DEFAULT_RETRY_DELAY_MS;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: shouldRetry,
      retryDelay: computeRetryDelay,
    },
    mutations: {
      retry: 0,
    },
  },
});
