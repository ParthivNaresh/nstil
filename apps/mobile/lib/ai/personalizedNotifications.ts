import { isAvailable } from "@/lib/ai/foundationModels";
import { generateNotificationTexts } from "@/lib/ai/notificationTextEngine";
import { fetchAIContext } from "@/services/api/aiContext";

const PERSONALIZED_TEXT_COUNT = 7;

export async function tryGeneratePersonalizedTexts(): Promise<readonly string[] | undefined> {
  try {
    const onDevice = await isAvailable();
    if (!onDevice) {
      console.debug("[notifications] Foundation Models not available, using static texts");
      return undefined;
    }

    const context = await fetchAIContext({ entryLimit: 5, daysBack: 7 });
    const texts = await generateNotificationTexts(context, PERSONALIZED_TEXT_COUNT);
    return texts.length > 0 ? texts : undefined;
  } catch (err) {
    console.error("[notifications] Failed to generate personalized texts:", err);
    return undefined;
  }
}
