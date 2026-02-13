import * as Linking from "expo-linking";

import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import type { DeepLinkType } from "@/types";

interface DeepLinkTokens {
  accessToken: string;
  refreshToken: string;
  type: DeepLinkType;
}

function parseDeepLinkType(typeParam: string | null): DeepLinkType {
  if (typeParam === "recovery") return "recovery";
  if (typeParam === "signup") return "signup";
  return null;
}

function extractTokensFromUrl(url: string): DeepLinkTokens | null {
  const hashIndex = url.indexOf("#");
  if (hashIndex === -1) return null;

  const fragment = url.substring(hashIndex + 1);
  const params = new URLSearchParams(fragment);

  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");

  if (!accessToken || !refreshToken) return null;

  const type = parseDeepLinkType(params.get("type"));

  return { accessToken, refreshToken, type };
}

async function handleDeepLinkUrl(url: string): Promise<void> {
  const tokens = extractTokensFromUrl(url);
  if (!tokens) return;

  if (tokens.type) {
    useAuthStore.getState().setPendingDeepLinkType(tokens.type);
  }

  await supabase.auth.setSession({
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken,
  });
}

export function setupDeepLinkListener(): () => void {
  const subscription = Linking.addEventListener("url", (event) => {
    void handleDeepLinkUrl(event.url);
  });

  void Linking.getInitialURL().then((url) => {
    if (url) {
      void handleDeepLinkUrl(url);
    }
  });

  return () => {
    subscription.remove();
  };
}
