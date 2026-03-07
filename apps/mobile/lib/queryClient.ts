import { QueryClient } from "@tanstack/react-query";

import { ApiError, NetworkError } from "@/services/api/errors";

const DEFAULT_RETRY_DELAY_MS = 1000;
const RATE_LIMIT_FALLBACK_DELAY_MS = 5000;
const NETWORK_BASE_DELAY_MS = 2000;
const NETWORK_MAX_DELAY_MS = 30000;

const MAX_NETWORK_RETRIES = 3;
const MAX_RATE_LIMIT_RETRIES = 2;
const MAX_API_RETRIES = 1;

function shouldRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof NetworkError) {
    return failureCount < MAX_NETWORK_RETRIES;
  }
  if (error instanceof ApiError) {
    if (error.isRateLimited) {
      return failureCount < MAX_RATE_LIMIT_RETRIES;
    }
    if (error.isUnauthorized) {
      return false;
    }
    return failureCount < MAX_API_RETRIES;
  }
  return failureCount < MAX_API_RETRIES;
}

function computeRetryDelay(attempt: number, error: unknown): number {
  if (error instanceof NetworkError) {
    const exponential = NETWORK_BASE_DELAY_MS * Math.pow(2, attempt);
    return Math.min(exponential, NETWORK_MAX_DELAY_MS);
  }
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
