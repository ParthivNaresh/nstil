import type {
  AIContextResponse,
  JournalEntry,
  MoodCategory,
  PromptSource,
  PromptType,
} from "@/types";

import { FoundationModelError, generateText } from "./foundationModels";
import { buildContextString } from "./promptContext";
import { buildInstructions, getPromptTemplate } from "./promptTemplates";

export interface GeneratedReflection {
  readonly content: string;
  readonly promptType: PromptType;
  readonly source: PromptSource;
  readonly moodCategory: MoodCategory | null;
  readonly entryId: string;
  readonly context: Record<string, unknown>;
}

const MAX_ENTRY_BODY_LENGTH = 2000;

function buildEntryContext(entry: JournalEntry): string {
  const parts: string[] = [];
  parts.push(`Title: ${entry.title || "Untitled"}`);
  if (entry.mood_category) {
    const mood = entry.mood_specific
      ? `${entry.mood_category} (${entry.mood_specific})`
      : entry.mood_category;
    parts.push(`Mood: ${mood}`);
  }
  if (entry.tags.length > 0) {
    parts.push(`Tags: ${entry.tags.join(", ")}`);
  }
  const body =
    entry.body.length > MAX_ENTRY_BODY_LENGTH
      ? `${entry.body.slice(0, MAX_ENTRY_BODY_LENGTH)}...`
      : entry.body;
  parts.push(`\nEntry:\n${body}`);
  return parts.join("\n");
}

export async function generateReflection(
  entry: JournalEntry,
  context: AIContextResponse,
): Promise<GeneratedReflection> {
  const template = getPromptTemplate("reflection");
  const userContext = buildContextString(context);
  const entryContext = buildEntryContext(entry);
  const fullContext = `${userContext}\n\nCURRENT ENTRY TO REFLECT ON:\n${entryContext}`;
  const instructions = buildInstructions(template, fullContext);

  const content = await generateText(
    instructions,
    "Generate a personalized reflection on this journal entry.",
  );
  const trimmed = content.trim().replace(/^["']|["']$/g, "");

  if (trimmed.length === 0) {
    throw new FoundationModelError(
      "generation_failed",
      "Empty reflection from model",
    );
  }

  return {
    content: trimmed,
    promptType: "reflection" as PromptType,
    source: "on_device_llm" as PromptSource,
    moodCategory: (entry.mood_category as MoodCategory) ?? null,
    entryId: entry.id,
    context: {
      source: "on_device_llm",
      entry_id: entry.id,
      entry_title: entry.title,
      mood_category: entry.mood_category,
      mood_specific: entry.mood_specific,
    },
  };
}
