import { Circle, Group } from "@shopify/react-native-skia";
import { useDerivedValue } from "react-native-reanimated";

import { getStarOpacity } from "@/lib/drift";

import type { StarFieldProps } from "./types";

const STAR_COLOR = "#FFFFFF";

export function StarField({ dayProgress, stars }: StarFieldProps) {
  const opacity = useDerivedValue(() => getStarOpacity(dayProgress.value));

  return (
    <Group opacity={opacity}>
      {stars.map((star, i) => (
        <Circle key={i} cx={star.x} cy={star.y} r={star.radius} color={STAR_COLOR} />
      ))}
    </Group>
  );
}
