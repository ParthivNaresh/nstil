import { Platform, Settings } from "react-native";
import * as SecureStore from "expo-secure-store";

const INSTALL_MARKER_KEY = "nstil_installed";

function isFirstLaunchAfterInstall(): boolean {
  if (Platform.OS !== "ios") {
    return false;
  }
  return Settings.get(INSTALL_MARKER_KEY) !== true;
}

function markInstalled(): void {
  if (Platform.OS !== "ios") {
    return;
  }
  Settings.set({ [INSTALL_MARKER_KEY]: true });
}

function getSupabaseStorageKey(): string {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
  try {
    const host = new URL(url).host.replace(/:/g, "-");
    return `sb-${host}-auth-token`;
  } catch {
    return "sb-localhost-auth-token";
  }
}

function buildKnownKeys(): readonly string[] {
  const supabaseKey = getSupabaseStorageKey();
  return [
    supabaseKey,
    `${supabaseKey}__meta`,
    `${supabaseKey}__chunk_0`,
    `${supabaseKey}__chunk_1`,
    `${supabaseKey}__chunk_2`,
    `${supabaseKey}__chunk_3`,
    `${supabaseKey}__chunk_4`,
    "supabase-auth-token",
    "supabase-auth-token__meta",
    "supabase-auth-token__chunk_0",
    "supabase-auth-token__chunk_1",
    "supabase-auth-token__chunk_2",
    "supabase-auth-token__chunk_3",
    "supabase-auth-token__chunk_4",
    "nstil_theme_mode",
    "nstil_custom_themes",
    "nstil_active_custom_id",
    "nstil_custom_theme_input",
  ];
}

async function clearStaleKeychain(): Promise<void> {
  const keys = buildKnownKeys();
  await Promise.all(
    keys.map((key) =>
      SecureStore.deleteItemAsync(key).catch(() => undefined),
    ),
  );
}

export async function handleFreshInstall(): Promise<void> {
  if (!isFirstLaunchAfterInstall()) {
    return;
  }
  await clearStaleKeychain();
  markInstalled();
}
