import type { CustomThemeInput } from "@/lib/themeBuilder";

export interface StoredCustomThemeData {
  readonly id: string;
  readonly name: string;
  readonly input: CustomThemeInput;
}

export interface Profile {
  readonly id: string;
  readonly display_name: string | null;
  readonly avatar_url: string | null;
  readonly onboarding_completed_at: string | null;
  readonly theme_mode: string;
  readonly custom_themes: readonly StoredCustomThemeData[];
  readonly active_custom_theme_id: string | null;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface ProfileUpdate {
  readonly display_name?: string | null;
  readonly theme_mode?: string;
  readonly custom_themes?: readonly StoredCustomThemeData[];
  readonly active_custom_theme_id?: string | null;
}
