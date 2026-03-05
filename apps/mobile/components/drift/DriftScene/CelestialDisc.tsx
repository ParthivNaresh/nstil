import { Circle, Group, RadialGradient, vec } from "@shopify/react-native-skia";
import { useDerivedValue } from "react-native-reanimated";

import { getMoonPosition, getSunPosition } from "@/lib/drift";

import type { CelestialDiscProps } from "./types";

const SUN_BODY_RADIUS = 55;
const SUN_GLOW_RADIUS = 95;
const SUN_ATMOSPHERE_RADIUS = 150;
const SUN_CORE = "#FFFDF5";
const SUN_EDGE = "#FFF8E700";
const SUN_GLOW_CORE = "#FFF0C840";
const SUN_GLOW_EDGE = "#FFF0C800";
const SUN_ATMO_CORE = "#FFF8E718";
const SUN_ATMO_EDGE = "#FFF8E700";

const MOON_BODY_RADIUS = 22;
const MOON_GLOW_RADIUS = 38;
const MOON_CORE = "#E0E8F0";
const MOON_EDGE = "#E0E8F000";
const MOON_GLOW_CORE = "#D0D8E830";
const MOON_GLOW_EDGE = "#D0D8E800";

export function CelestialDisc({ body, dayProgress, width, height }: CelestialDiscProps) {
  const position = useDerivedValue(() =>
    body === "sun"
      ? getSunPosition(dayProgress.value, width, height)
      : getMoonPosition(dayProgress.value, width, height),
  );

  const center = useDerivedValue(() => vec(position.value.x, position.value.y));
  const opacity = useDerivedValue(() => position.value.opacity);

  if (body === "sun") {
    return (
      <Group opacity={opacity}>
        <Circle c={center} r={SUN_ATMOSPHERE_RADIUS}>
          <RadialGradient
            c={center}
            r={SUN_ATMOSPHERE_RADIUS}
            colors={[SUN_ATMO_CORE, SUN_ATMO_EDGE]}
          />
        </Circle>
        <Circle c={center} r={SUN_GLOW_RADIUS}>
          <RadialGradient
            c={center}
            r={SUN_GLOW_RADIUS}
            colors={[SUN_GLOW_CORE, SUN_GLOW_EDGE]}
          />
        </Circle>
        <Circle c={center} r={SUN_BODY_RADIUS}>
          <RadialGradient c={center} r={SUN_BODY_RADIUS} colors={[SUN_CORE, SUN_EDGE]} />
        </Circle>
      </Group>
    );
  }

  return (
    <Group opacity={opacity}>
      <Circle c={center} r={MOON_GLOW_RADIUS}>
        <RadialGradient
          c={center}
          r={MOON_GLOW_RADIUS}
          colors={[MOON_GLOW_CORE, MOON_GLOW_EDGE]}
        />
      </Circle>
      <Circle c={center} r={MOON_BODY_RADIUS}>
        <RadialGradient c={center} r={MOON_BODY_RADIUS} colors={[MOON_CORE, MOON_EDGE]} />
      </Circle>
    </Group>
  );
}
