import type { JournalEntry, MoodCategory, MoodSpecific } from "./journal";

export type SessionType =
  | "check_in"
  | "guided_journal"
  | "reflection"
  | "insight"
  | "conversation"
  | "voice_to_journal"
  | "agent_task";

export type SessionStatus =
  | "active"
  | "paused"
  | "completed"
  | "abandoned"
  | "converted"
  | "failed";

export type TriggerSource =
  | "notification"
  | "manual"
  | "app_open"
  | "post_entry"
  | "scheduled"
  | "widget"
  | "shortcut"
  | "agent";

export type PromptType =
  | "check_in"
  | "guided"
  | "reflection"
  | "nudge"
  | "summary"
  | "affirmation"
  | "reframe"
  | "follow_up"
  | "goal_check"
  | "notification";

export type PromptSource = "curated" | "on_device_llm" | "cloud_llm";

export type PromptStatus =
  | "pending"
  | "delivered"
  | "seen"
  | "engaged"
  | "dismissed"
  | "expired"
  | "converted";

export type InsightType =
  | "pattern"
  | "trend"
  | "connection"
  | "goal_progress"
  | "weekly_summary"
  | "monthly_summary"
  | "yearly_summary"
  | "cognitive_pattern"
  | "streak_milestone"
  | "correlation"
  | "anomaly"
  | "recommendation";

export type InsightSource = "on_device_llm" | "cloud_llm" | "computed";

export type InsightStatus =
  | "generated"
  | "delivered"
  | "seen"
  | "dismissed"
  | "bookmarked";

export type PromptStyle = "gentle" | "direct" | "analytical" | "motivational";

export interface AISession {
  readonly id: string;
  readonly user_id: string;
  readonly parent_session_id: string | null;
  readonly session_type: SessionType;
  readonly status: SessionStatus;
  readonly entry_id: string | null;
  readonly trigger_source: TriggerSource | null;
  readonly model_id: string | null;
  readonly flow_state: Record<string, unknown>;
  readonly token_count_total: number;
  readonly metadata: Record<string, unknown>;
  readonly created_at: string;
  readonly completed_at: string | null;
}

export interface CheckInResponse {
  readonly session: AISession;
  readonly prompt_content: string | null;
  readonly entry: JournalEntry | null;
}

export interface AIPrompt {
  readonly id: string;
  readonly user_id: string;
  readonly prompt_type: PromptType;
  readonly content: string;
  readonly context: Record<string, unknown>;
  readonly source: PromptSource;
  readonly mood_category: MoodCategory | null;
  readonly session_id: string | null;
  readonly entry_id: string | null;
  readonly converted_entry_id: string | null;
  readonly status: PromptStatus;
  readonly delivered_at: string | null;
  readonly seen_at: string | null;
  readonly engaged_at: string | null;
  readonly dismissed_at: string | null;
  readonly converted_at: string | null;
  readonly created_at: string;
}

export interface AIInsight {
  readonly id: string;
  readonly user_id: string;
  readonly insight_type: InsightType;
  readonly title: string;
  readonly content: string;
  readonly supporting_entry_ids: string[];
  readonly source: InsightSource;
  readonly model_id: string | null;
  readonly confidence: number | null;
  readonly period_start: string | null;
  readonly period_end: string | null;
  readonly status: InsightStatus;
  readonly session_id: string | null;
  readonly superseded_by: string | null;
  readonly metadata: Record<string, unknown>;
  readonly created_at: string;
  readonly expires_at: string | null;
}

export interface AIProfile {
  readonly user_id: string;
  readonly ai_enabled: boolean;
  readonly prompt_style: PromptStyle;
  readonly topics_to_avoid: string[];
  readonly goals: Record<string, unknown>[];
  readonly last_check_in_at: string | null;
  readonly updated_at: string;
}

export interface StartCheckInRequest {
  readonly trigger_source?: TriggerSource;
}

export interface RespondCheckInRequest {
  readonly mood_category: MoodCategory;
  readonly mood_specific?: MoodSpecific;
  readonly response_text?: string;
}

export interface ConvertCheckInRequest {
  readonly journal_id?: string;
  readonly title?: string;
}

export interface GeneratePromptRequest {
  readonly prompt_type?: PromptType;
  readonly entry_id?: string;
}

export interface AIPromptUpdate {
  readonly status?: PromptStatus;
  readonly converted_entry_id?: string;
  readonly delivered_at?: string;
  readonly seen_at?: string;
  readonly engaged_at?: string;
  readonly dismissed_at?: string;
  readonly converted_at?: string;
}

export interface AIInsightUpdate {
  readonly status?: InsightStatus;
  readonly superseded_by?: string;
  readonly metadata?: Record<string, unknown>;
}

export interface AIProfileUpdate {
  readonly ai_enabled?: boolean;
  readonly prompt_style?: PromptStyle;
  readonly topics_to_avoid?: string[];
  readonly goals?: Record<string, unknown>[];
}
