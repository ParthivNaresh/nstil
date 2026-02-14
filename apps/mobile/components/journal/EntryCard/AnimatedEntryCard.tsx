import { useEffect } from "react";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

import { duration } from "@/styles";

import { EntryCard } from "./EntryCard";
import type { EntryCardProps } from "./types";

interface AnimatedEntryCardProps extends EntryCardProps {
  readonly index: number;
}

const STAGGER_DELAY = 60;
const MAX_STAGGER_INDEX = 10;

export function AnimatedEntryCard({ index, ...cardProps }: AnimatedEntryCardProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(12);

  useEffect(() => {
    const delay = Math.min(index, MAX_STAGGER_INDEX) * STAGGER_DELAY;
    opacity.value = withDelay(delay, withTiming(1, { duration: duration.normal }));
    translateY.value = withDelay(delay, withTiming(0, { duration: duration.normal }));
  }, [index, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <EntryCard {...cardProps} />
    </Animated.View>
  );
}
