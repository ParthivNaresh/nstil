import {
  checkAIAvailability,
  nativeGenerate,
} from "@/modules/nstil-ai/src";
import type { AIAvailabilityResult, AIModelStatus } from "@/modules/nstil-ai/src";

export type { AIAvailabilityResult, AIModelStatus };

const GENERATION_TIMEOUT_MS = 30_000;

export class FoundationModelError extends Error {
  readonly code: "timeout" | "generation_failed" | "unavailable";

  constructor(code: FoundationModelError["code"], message: string) {
    super(message);
    this.name = "FoundationModelError";
    this.code = code;
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new FoundationModelError("timeout", `Generation timed out after ${ms}ms`)),
      ms,
    );
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((err: unknown) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

export async function isAvailable(): Promise<boolean> {
  const result = await checkAIAvailability();
  return result.status === "available";
}

export async function getAvailability(): Promise<AIAvailabilityResult> {
  return checkAIAvailability();
}

export async function generateText(
  instructions: string,
  prompt: string,
): Promise<string> {
  try {
    return await withTimeout(
      nativeGenerate(instructions, prompt),
      GENERATION_TIMEOUT_MS,
    );
  } catch (err) {
    if (err instanceof FoundationModelError) throw err;
    const message = err instanceof Error ? err.message : "Unknown error";
    throw new FoundationModelError("generation_failed", message);
  }
}

export async function generateStructured<T>(
  instructions: string,
  prompt: string,
): Promise<T> {
  const raw = await generateText(instructions, prompt);
  const cleaned = raw.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    throw new FoundationModelError(
      "generation_failed",
      `Failed to parse structured response: ${raw.slice(0, 200)}`,
    );
  }
}
