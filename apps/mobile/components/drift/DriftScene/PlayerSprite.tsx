import { Circle, Group, RadialGradient, vec } from "@shopify/react-native-skia";
import { useDerivedValue } from "react-native-reanimated";

import { lerp } from "@/lib/animation";
import { DRIFT_CONFIG } from "@/lib/drift";

import type { PlayerSpriteProps } from "./types";

const { player } = DRIFT_CONFIG;

const BODY_RADIUS = 8;
const GLOW_RADIUS = 16;
const BODY_COLOR = "#E8E0D8";
const BODY_EDGE = "#E8E0D880";
const GLOW_CORE = "#E8E0D830";
const GLOW_EDGE = "#E8E0D800";
const TOUCHING_SQUASH = 0.85;

export function PlayerSprite({ playerY, isTouching, width }: PlayerSpriteProps) {
  const fixedX = width * player.fixedX;

  const center = useDerivedValue(() => vec(fixedX, playerY.value));

  const scaleY = useDerivedValue(() =>
    lerp(1, TOUCHING_SQUASH, isTouching.value),
  );

  const transform = useDerivedValue(() => [
    { translateX: fixedX },
    { translateY: playerY.value },
    { scaleY: scaleY.value },
    { translateX: -fixedX },
    { translateY: -playerY.value },
  ]);

  return (
    <Group transform={transform}>
      <Circle c={center} r={GLOW_RADIUS}>
        <RadialGradient c={center} r={GLOW_RADIUS} colors={[GLOW_CORE, GLOW_EDGE]} />
      </Circle>
      <Circle c={center} r={BODY_RADIUS}>
        <RadialGradient c={center} r={BODY_RADIUS} colors={[BODY_COLOR, BODY_EDGE]} />
      </Circle>
    </Group>
  );
}
