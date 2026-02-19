import type { WeeklySummaryData } from "@/lib/insightUtils";
import type { InsightSource, InsightType } from "@/types";

import { FoundationModelError, generateText } from "./foundationModels";
import { buildInstructions, getPromptTemplate } from "./promptTemplates";

export interface GeneratedNarrativeSummary {
  readonly content: string;
  readonly insightType: InsightType;
  readonly source: InsightSource;
  readonly title: string;
  readonly periodStart: string;
  readonly periodEnd: string;
  readonly metadata: Record<string, unknown>;
}

function buildWeeklyContext(data: WeeklySummaryData): string {
  const parts: string[] = [];

  const label = data.entryCount === 1 ? "entry" : "entries";
  parts.push(`Total entries this week: ${data.entryCount} ${label}.`);
  parts.push(`Period: ${data.periodStart} to ${data.periodEnd}.`);

  const moodEntries = Object.entries(data.moodDistribution);
  if (moodEntries.length > 0) {
    const sorted = moodEntries.sort(([, a], [, b]) => b - a);
    const breakdown = sorted
      .map(([mood, count]) => `${count} ${mood}`)
      .join(", ");
    parts.push(`Exact mood counts: ${breakdown}.`);
  }

  if (data.topTags.length > 0) {
    parts.push(`Top themes: ${data.topTags.join(", ")}.`);
  }

  if (data.avgEntryLength > 0) {
    parts.push(`Average entry length: ${data.avgEntryLength} characters.`);
  }

  return parts.join("\n");
}

export async function generateNarrativeSummary(
  data: WeeklySummaryData,
): Promise<GeneratedNarrativeSummary> {
  const template = getPromptTemplate("weekly_narrative");
  const weeklyContext = buildWeeklyContext(data);
  const instructions = buildInstructions(template, weeklyContext);

  const content = await generateText(
    instructions,
    template.promptSuffix,
  );
  const trimmed = content.trim().replace(/^["']|["']$/g, "");

  if (trimmed.length === 0) {
    throw new FoundationModelError(
      "generation_failed",
      "Empty narrative from model",
    );
  }

  return {
    content: trimmed,
    insightType: "weekly_summary" as InsightType,
    source: "on_device_llm" as InsightSource,
    title: `Week of ${data.periodStart}`,
    periodStart: data.periodStart,
    periodEnd: data.periodEnd,
    metadata: {
      source: "on_device_llm",
      entry_count: data.entryCount,
      dominant_mood: data.dominantMood,
      top_tags: data.topTags,
    },
  };
}
