import type { AIContextResponse } from "@/types";

import { generateText } from "./foundationModels";
import { buildContextString } from "./promptContext";
import { buildInstructions, getPromptTemplate } from "./promptTemplates";

const MAX_NOTIFICATION_LENGTH = 120;

export async function generateNotificationTexts(
  context: AIContextResponse,
  count: number,
): Promise<string[]> {
  const template = getPromptTemplate("notification_text");
  const userContext = buildContextString(context);
  const instructions = buildInstructions(template, userContext);

  const prompt = [
    `Generate exactly ${count} unique, short notification messages.`,
    "Each message should be on its own line.",
    "Each message must be under 100 characters.",
    "Do not number them or add bullet points.",
    "Make each one feel different in tone and angle.",
  ].join(" ");

  const content = await generateText(instructions, prompt);

  const lines = content
    .split("\n")
    .map((line) => line.trim().replace(/^[-•*\d.)\s]+/, "").replace(/^["']|["']$/g, ""))
    .filter((line) => line.length > 0 && line.length <= MAX_NOTIFICATION_LENGTH);

  return lines.slice(0, count);
}
