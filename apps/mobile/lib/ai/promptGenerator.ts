import type { AIContextResponse, MoodCategory, PromptSource, PromptType } from "@/types";

import { FoundationModelError, generateText } from "./foundationModels";
import { buildContextString } from "./promptContext";
import { buildInstructions, getPromptSuffix, getPromptTemplate } from "./promptTemplates";

export interface GeneratedPrompt {
  readonly content: string;
  readonly promptType: PromptType;
  readonly source: PromptSource;
  readonly moodCategory: MoodCategory | null;
  readonly context: Record<string, unknown>;
}

const INACTIVITY_THRESHOLD_DAYS = 3;
const DIFFICULT_MOOD_THRESHOLD = 3;
const GOAL_CHECK_INTERVAL_DAYS = 7;
const DIFFICULT_MOODS: ReadonlySet<string> = new Set(["sad", "anxious", "angry"]);

function getDominantMood(context: AIContextResponse): string | null {
  if (context.mood_distribution.length === 0) return null;
  return context.mood_distribution[0].mood_category;
}

function daysSinceLastEntry(context: AIContextResponse): number | null {
  if (!context.stats.last_entry_at) return null;
  const delta = Date.now() - new Date(context.stats.last_entry_at).getTime();
  return Math.floor(delta / (1000 * 60 * 60 * 24));
}

function hasCheckInToday(context: AIContextResponse): boolean {
  const today = new Date().toISOString().slice(0, 10);
  return context.recent_entries.some(
    (e) => e.entry_type === "check_in" && e.created_at.slice(0, 10) === today,
  );
}

function countDifficultMoods(context: AIContextResponse): number {
  return context.mood_distribution
    .filter((m) => DIFFICULT_MOODS.has(m.mood_category))
    .reduce((sum, m) => sum + m.count, 0);
}

function hasRecentGoalCheck(context: AIContextResponse): boolean {
  const cutoff = Date.now() - GOAL_CHECK_INTERVAL_DAYS * 24 * 60 * 60 * 1000;
  return context.recent_prompts.some(
    (p) => p.prompt_type === "goal_check" && new Date(p.created_at).getTime() >= cutoff,
  );
}

function determinePromptType(context: AIContextResponse): PromptType {
  const daysInactive = daysSinceLastEntry(context);
  if (daysInactive !== null && daysInactive >= INACTIVITY_THRESHOLD_DAYS) {
    return "nudge" as PromptType;
  }

  if (!hasCheckInToday(context)) {
    return "check_in" as PromptType;
  }

  if (countDifficultMoods(context) >= DIFFICULT_MOOD_THRESHOLD) {
    return "affirmation" as PromptType;
  }

  if (context.profile.goals.length > 0 && !hasRecentGoalCheck(context)) {
    return "goal_check" as PromptType;
  }

  return "guided" as PromptType;
}

function buildGenerationContext(
  context: AIContextResponse,
  promptType: string,
  dominantMood: string | null,
): Record<string, unknown> {
  return {
    source: "on_device_llm",
    determined_type: promptType,
    dominant_mood: dominantMood,
    total_entries: context.stats.total_entries,
    entries_last_7d: context.stats.entries_last_7d,
    prompt_style: context.profile.prompt_style,
  };
}

export async function generateOnDevicePrompt(
  context: AIContextResponse,
  promptType?: PromptType,
): Promise<GeneratedPrompt> {
  const resolvedType = promptType ?? determinePromptType(context);
  const dominantMood = getDominantMood(context);

  const template = getPromptTemplate(resolvedType);
  const contextString = buildContextString(context);
  const instructions = buildInstructions(template, contextString);
  const prompt = getPromptSuffix(template);

  const content = await generateText(instructions, prompt);
  const trimmed = content.trim().replace(/^["']|["']$/g, "");

  if (trimmed.length === 0) {
    throw new FoundationModelError("generation_failed", "Empty response from model");
  }

  return {
    content: trimmed,
    promptType: resolvedType,
    source: "on_device_llm" as PromptSource,
    moodCategory: (dominantMood as MoodCategory) ?? null,
    context: buildGenerationContext(context, resolvedType, dominantMood),
  };
}
