import * as SecureStore from "expo-secure-store";
import { Appearance } from "react-native";
import { create } from "zustand";

import type { ColorPalette } from "@/styles/palettes";
import { darkPalette, lightPalette, oledPalette } from "@/styles/palettes";
import type { PresetId } from "@/styles/presetPalettes";
import { getPresetTheme } from "@/styles/presetPalettes";
import type { BuiltCustomTheme, CustomThemeInput } from "@/lib/themeBuilder";
import { buildCustomPalette } from "@/lib/themeBuilder";
import type { StoredCustomThemeData } from "@/types/profile";

export type ThemeMode = "dark" | "light" | "oled" | "auto" | "custom" | PresetId;

export interface SavedCustomTheme {
  readonly id: string;
  readonly name: string;
  readonly input: CustomThemeInput;
  readonly built: BuiltCustomTheme;
}

const MODE_STORAGE_KEY = "nstil_theme_mode";
const CUSTOM_THEMES_STORAGE_KEY = "nstil_custom_themes";
const ACTIVE_CUSTOM_ID_STORAGE_KEY = "nstil_active_custom_id";

const MAX_CUSTOM_THEMES = 4;

const STANDARD_MODES: ReadonlySet<string> = new Set([
  "dark", "light", "oled", "auto", "custom",
]);

function resolveAutoMode(): "dark" | "light" {
  const scheme = Appearance.getColorScheme();
  return scheme === "light" ? "light" : "dark";
}

function findActiveCustom(
  themes: readonly SavedCustomTheme[],
  activeId: string | null,
): SavedCustomTheme | null {
  if (!activeId) return null;
  return themes.find((t) => t.id === activeId) ?? null;
}

function resolvePalette(
  mode: ThemeMode,
  activeCustom: SavedCustomTheme | null,
): ColorPalette {
  switch (mode) {
    case "dark":
      return darkPalette;
    case "light":
      return lightPalette;
    case "oled":
      return oledPalette;
    case "auto":
      return resolvePalette(resolveAutoMode(), activeCustom);
    case "custom":
      return activeCustom?.built.palette ?? darkPalette;
    default: {
      const preset = getPresetTheme(mode);
      return preset?.palette ?? darkPalette;
    }
  }
}

function resolveIsDark(
  mode: ThemeMode,
  activeCustom: SavedCustomTheme | null,
): boolean {
  if (mode === "light") return false;
  if (mode === "auto") return resolveAutoMode() !== "light";
  if (mode === "dark" || mode === "oled") return true;
  if (mode === "custom") return activeCustom?.built.isDark ?? true;
  const preset = getPresetTheme(mode);
  return preset?.isDark ?? true;
}

function resolveKeyboardAppearance(
  mode: ThemeMode,
  activeCustom: SavedCustomTheme | null,
): "dark" | "light" {
  return resolveIsDark(mode, activeCustom) ? "dark" : "light";
}

export interface ThemeSnapshot {
  readonly theme_mode: string;
  readonly custom_themes: readonly StoredCustomThemeData[];
  readonly active_custom_theme_id: string | null;
}

interface ThemeState {
  readonly mode: ThemeMode;
  readonly colors: ColorPalette;
  readonly isDark: boolean;
  readonly keyboardAppearance: "dark" | "light";
  readonly customThemes: readonly SavedCustomTheme[];
  readonly activeCustomId: string | null;
  readonly initialized: boolean;
  initialize: () => void;
  setMode: (mode: ThemeMode) => void;
  saveCustomTheme: (name: string, input: CustomThemeInput) => SavedCustomTheme;
  updateCustomTheme: (id: string, name: string, input: CustomThemeInput) => void;
  deleteCustomTheme: (id: string) => void;
  activateCustomTheme: (id: string) => void;
  syncFromProfile: (
    themeMode: string,
    serverThemes: readonly StoredCustomThemeData[],
    activeId: string | null,
  ) => void;
  getThemeSnapshot: () => ThemeSnapshot;
}

function computeState(
  mode: ThemeMode,
  themes: readonly SavedCustomTheme[],
  activeId: string | null,
) {
  const activeCustom = findActiveCustom(themes, activeId);
  return {
    mode,
    colors: resolvePalette(mode, activeCustom),
    isDark: resolveIsDark(mode, activeCustom),
    keyboardAppearance: resolveKeyboardAppearance(mode, activeCustom),
  };
}

function generateId(): string {
  return `custom_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

interface StoredCustomTheme {
  readonly id: string;
  readonly name: string;
  readonly input: CustomThemeInput;
}

function loadCustomThemes(): readonly SavedCustomTheme[] {
  try {
    const raw = SecureStore.getItem(CUSTOM_THEMES_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return (parsed as unknown[])
      .filter(isValidStoredTheme)
      .slice(0, MAX_CUSTOM_THEMES)
      .map((stored) => ({
        id: stored.id,
        name: stored.name,
        input: stored.input,
        built: buildCustomPalette(stored.input),
      }));
  } catch {
    return [];
  }
}

function persistCustomThemes(themes: readonly SavedCustomTheme[]): void {
  try {
    const stored: StoredCustomTheme[] = themes.map((t) => ({
      id: t.id,
      name: t.name,
      input: t.input,
    }));
    SecureStore.setItem(CUSTOM_THEMES_STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // non-critical
  }
}

function loadActiveCustomId(): string | null {
  try {
    return SecureStore.getItem(ACTIVE_CUSTOM_ID_STORAGE_KEY) ?? null;
  } catch {
    return null;
  }
}

function persistActiveCustomId(id: string | null): void {
  try {
    if (id) {
      SecureStore.setItem(ACTIVE_CUSTOM_ID_STORAGE_KEY, id);
    } else {
      SecureStore.deleteItemAsync(ACTIVE_CUSTOM_ID_STORAGE_KEY).catch(() => undefined);
    }
  } catch {
    // non-critical
  }
}

function persistMode(mode: ThemeMode): void {
  try {
    SecureStore.setItem(MODE_STORAGE_KEY, mode);
  } catch {
    // non-critical
  }
}

function isValidStoredTheme(value: unknown): value is StoredCustomTheme {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;
  if (typeof obj.id !== "string" || typeof obj.name !== "string") return false;
  const input = obj.input;
  if (typeof input !== "object" || input === null) return false;
  const inp = input as Record<string, unknown>;
  return (
    typeof inp.background === "string" &&
    typeof inp.cardColor === "string" &&
    typeof inp.textPrimary === "string" &&
    typeof inp.textSecondary === "string" &&
    typeof inp.accent === "string" &&
    typeof inp.gradient1 === "string" &&
    typeof inp.gradient2 === "string" &&
    typeof inp.gradient3 === "string"
  );
}

function isValidMode(value: string | null): value is ThemeMode {
  if (value === null) return false;
  if (STANDARD_MODES.has(value)) return true;
  return getPresetTheme(value as PresetId) !== undefined;
}

export { MAX_CUSTOM_THEMES };

export const useThemeStore = create<ThemeState>((set, get) => ({
  ...computeState("dark", [], null),
  customThemes: [],
  activeCustomId: null,
  initialized: false,

  initialize: () => {
    let storedMode: string | null = null;
    try {
      storedMode = SecureStore.getItem(MODE_STORAGE_KEY);
    } catch {
      // fall through
    }

    const mode = isValidMode(storedMode) ? storedMode : "dark";
    const customThemes = loadCustomThemes();
    const activeCustomId = loadActiveCustomId();

    set({
      ...computeState(mode, customThemes, activeCustomId),
      customThemes,
      activeCustomId,
      initialized: true,
    });
  },

  setMode: (mode: ThemeMode) => {
    const { customThemes, activeCustomId } = get();
    persistMode(mode);
    set(computeState(mode, customThemes, activeCustomId));
  },

  saveCustomTheme: (name: string, input: CustomThemeInput) => {
    const { customThemes } = get();
    const built = buildCustomPalette(input);
    const id = generateId();
    const newTheme: SavedCustomTheme = { id, name, input, built };
    const updated = [...customThemes, newTheme].slice(-MAX_CUSTOM_THEMES);

    persistCustomThemes(updated);
    persistActiveCustomId(id);
    persistMode("custom");

    set({
      ...computeState("custom", updated, id),
      customThemes: updated,
      activeCustomId: id,
    });

    return newTheme;
  },

  updateCustomTheme: (id: string, name: string, input: CustomThemeInput) => {
    const { customThemes, activeCustomId, mode } = get();
    const built = buildCustomPalette(input);
    const updated = customThemes.map((t) =>
      t.id === id ? { ...t, name, input, built } : t,
    );

    persistCustomThemes(updated);

    set({
      ...computeState(mode, updated, activeCustomId),
      customThemes: updated,
    });
  },

  deleteCustomTheme: (id: string) => {
    const { customThemes, activeCustomId, mode } = get();
    const updated = customThemes.filter((t) => t.id !== id);
    persistCustomThemes(updated);

    if (activeCustomId === id) {
      const fallbackMode: ThemeMode = updated.length > 0 ? "custom" : "dark";
      const fallbackId = updated.length > 0 ? updated[updated.length - 1].id : null;
      persistActiveCustomId(fallbackId);
      persistMode(fallbackMode);
      set({
        ...computeState(fallbackMode, updated, fallbackId),
        customThemes: updated,
        activeCustomId: fallbackId,
      });
    } else {
      set({
        ...computeState(mode, updated, activeCustomId),
        customThemes: updated,
      });
    }
  },

  activateCustomTheme: (id: string) => {
    const { customThemes } = get();
    persistMode("custom");
    persistActiveCustomId(id);
    set({
      ...computeState("custom", customThemes, id),
      activeCustomId: id,
    });
  },

  syncFromProfile: (
    themeMode: string,
    serverThemes: readonly StoredCustomThemeData[],
    activeId: string | null,
  ) => {
    const mode: ThemeMode = isValidMode(themeMode) ? themeMode : "dark";
    const customThemes: readonly SavedCustomTheme[] = serverThemes
      .filter((t): t is StoredCustomThemeData => isValidStoredTheme(t))
      .slice(0, MAX_CUSTOM_THEMES)
      .map((t) => ({
        id: t.id,
        name: t.name,
        input: t.input,
        built: buildCustomPalette(t.input),
      }));

    persistMode(mode);
    persistCustomThemes(customThemes);
    persistActiveCustomId(activeId);

    set({
      ...computeState(mode, customThemes, activeId),
      customThemes,
      activeCustomId: activeId,
    });
  },

  getThemeSnapshot: (): ThemeSnapshot => {
    const { mode, customThemes, activeCustomId } = get();
    return {
      theme_mode: mode,
      custom_themes: customThemes.map((t) => ({
        id: t.id,
        name: t.name,
        input: t.input,
      })),
      active_custom_theme_id: activeCustomId,
    };
  },
}));
