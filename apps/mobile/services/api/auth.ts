const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000";

const SIGN_OUT_PATH = "/api/v1/auth/sign-out";

export async function signOutFromBackend(token: string): Promise<void> {
  try {
    await fetch(`${API_URL}${SIGN_OUT_PATH}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch {
    // Best-effort — token expires naturally if backend is unreachable
  }
}
