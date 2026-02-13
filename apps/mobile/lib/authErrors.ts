import type { AuthError } from "@supabase/supabase-js";

type TranslateFn = (key: string) => string;

const SUPABASE_ERROR_MAP: Record<string, string> = {
  invalid_credentials: "auth.errors.invalidCredentials",
  user_already_exists: "auth.errors.emailTaken",
  over_request_rate_limit: "auth.errors.tooManyRequests",
  email_address_invalid: "auth.validation.emailInvalid",
};

export function mapAuthError(error: unknown, t: TranslateFn): string {
  if (isNetworkError(error)) {
    return t("auth.errors.networkError");
  }

  if (isSupabaseAuthError(error)) {
    const code = error.code ?? "";
    const mappedKey = SUPABASE_ERROR_MAP[code];
    if (mappedKey) {
      return t(mappedKey);
    }
  }

  return t("auth.errors.generic");
}

function isSupabaseAuthError(error: unknown): error is AuthError {
  return (
    error !== null &&
    typeof error === "object" &&
    "code" in error &&
    "message" in error &&
    "__isAuthError" in error
  );
}

function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError && error.message === "Network request failed") {
    return true;
  }
  return false;
}
