import { requireNativeModule } from "expo-modules-core";
import { Platform } from "react-native";

interface NStilAINativeModule {
  checkAvailability(): Promise<{ status: string; reason: string | null }>;
  generate(instructions: string, prompt: string): Promise<string>;
}

function loadNativeModule(): NStilAINativeModule | null {
  if (Platform.OS !== "ios") return null;

  try {
    return requireNativeModule<NStilAINativeModule>("NStilAI");
  } catch (err) {
    console.warn("[NStilAI] Failed to load native module:", err);
    return null;
  }
}

const NStilAI: NStilAINativeModule | null = loadNativeModule();

export type AIModelStatus = "available" | "unavailable" | "downloading" | "notSupported";

export interface AIAvailabilityResult {
  readonly status: AIModelStatus;
  readonly reason: string | null;
}

export async function checkAIAvailability(): Promise<AIAvailabilityResult> {
  if (!NStilAI) {
    return { status: "notSupported", reason: "Native module not available" };
  }
  const result = await NStilAI.checkAvailability();
  return {
    status: result.status as AIModelStatus,
    reason: result.reason,
  };
}

export async function nativeGenerate(
  instructions: string,
  prompt: string,
): Promise<string> {
  if (!NStilAI) {
    throw new Error("Foundation Models not available on this platform");
  }
  return NStilAI.generate(instructions, prompt);
}
