export interface Profile {
  readonly id: string;
  readonly display_name: string | null;
  readonly avatar_url: string | null;
  readonly onboarding_completed_at: string | null;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface ProfileUpdate {
  readonly display_name?: string | null;
}
