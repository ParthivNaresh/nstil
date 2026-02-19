import { useHomePrompt } from "@/hooks/useHomePrompt";

import { CheckInCard } from "./CheckInCard";
import { CheckInCardSkeleton } from "./CheckInCardSkeleton";
import { CheckInFallbackCard } from "./CheckInFallbackCard";

export function HomeCheckInSection() {
  const { data: prompt, isLoading, isError } = useHomePrompt();

  if (isLoading) {
    return <CheckInCardSkeleton />;
  }

  if (isError || !prompt) {
    return <CheckInFallbackCard />;
  }

  return <CheckInCard prompt={prompt} />;
}
