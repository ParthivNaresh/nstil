import { useEffect, useRef } from "react";

import { useUpdateProfile } from "@/hooks/useProfile";
import { useThemeStore } from "@/stores/themeStore";
import type { ThemeSnapshot } from "@/stores/themeStore";
import type { Profile } from "@/types";

function snapshotsEqual(a: ThemeSnapshot, b: ThemeSnapshot): boolean {
  if (a.theme_mode !== b.theme_mode) return false;
  if (a.active_custom_theme_id !== b.active_custom_theme_id) return false;
  if (a.custom_themes.length !== b.custom_themes.length) return false;
  return JSON.stringify(a.custom_themes) === JSON.stringify(b.custom_themes);
}

export function useThemeSync(profile: Profile | undefined): void {
  const syncFromProfile = useThemeStore((s) => s.syncFromProfile);
  const getThemeSnapshot = useThemeStore((s) => s.getThemeSnapshot);
  const mode = useThemeStore((s) => s.mode);
  const customThemes = useThemeStore((s) => s.customThemes);
  const activeCustomId = useThemeStore((s) => s.activeCustomId);
  const { mutate: pushUpdate } = useUpdateProfile();
  const hasSyncedFromServer = useRef(false);
  const lastPushedSnapshot = useRef<ThemeSnapshot | null>(null);

  useEffect(() => {
    if (!profile || hasSyncedFromServer.current) return;

    syncFromProfile(
      profile.theme_mode,
      profile.custom_themes,
      profile.active_custom_theme_id,
    );
    hasSyncedFromServer.current = true;

    lastPushedSnapshot.current = {
      theme_mode: profile.theme_mode,
      custom_themes: profile.custom_themes,
      active_custom_theme_id: profile.active_custom_theme_id,
    };
  }, [profile, syncFromProfile]);

  useEffect(() => {
    if (!hasSyncedFromServer.current) return;

    const snapshot = getThemeSnapshot();

    if (lastPushedSnapshot.current && snapshotsEqual(snapshot, lastPushedSnapshot.current)) {
      return;
    }

    lastPushedSnapshot.current = snapshot;

    pushUpdate({
      theme_mode: snapshot.theme_mode,
      custom_themes: [...snapshot.custom_themes],
      active_custom_theme_id: snapshot.active_custom_theme_id,
    });
  }, [mode, customThemes, activeCustomId, getThemeSnapshot, pushUpdate]);
}
