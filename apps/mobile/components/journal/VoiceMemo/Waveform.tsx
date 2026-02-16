import {
  Canvas,
  Group,
  rect,
  RoundedRect,
} from "@shopify/react-native-skia";
import { useMemo } from "react";
import { StyleSheet } from "react-native";
import type { SharedValue } from "react-native-reanimated";
import { useDerivedValue } from "react-native-reanimated";

import { useTheme } from "@/hooks/useTheme";
import { withAlpha } from "@/lib/colorUtils";
import { radius } from "@/styles";

import type { WaveformBarData } from "./types";

const BAR_WIDTH = 3;
const BAR_GAP = 2;
const BAR_MIN_HEIGHT = 4;
const WAVEFORM_HEIGHT = 40;

interface WaveformStaticProps {
  readonly bars: WaveformBarData[];
  readonly accentColor?: string;
}

export function WaveformStatic({ bars, accentColor }: WaveformStaticProps) {
  const { colors } = useTheme();
  const activeColor = accentColor ?? colors.accent;
  const totalWidth = bars.length * (BAR_WIDTH + BAR_GAP) - BAR_GAP;

  const barPositions = useMemo(
    () =>
      bars.map((bar, index) => {
        const barHeight = Math.max(BAR_MIN_HEIGHT, bar.amplitude * WAVEFORM_HEIGHT);
        const x = index * (BAR_WIDTH + BAR_GAP);
        const y = (WAVEFORM_HEIGHT - barHeight) / 2;
        return { x, y, height: barHeight };
      }),
    [bars],
  );

  return (
    <Canvas style={[styles.canvas, { width: totalWidth }]}>
      {barPositions.map((pos, index) => (
        <RoundedRect
          key={index}
          x={pos.x}
          y={pos.y}
          width={BAR_WIDTH}
          height={pos.height}
          r={radius.xs}
          color={activeColor}
        />
      ))}
    </Canvas>
  );
}

interface WaveformProps {
  readonly bars: WaveformBarData[];
  readonly progress: SharedValue<number>;
  readonly accentColor?: string;
}

export function Waveform({ bars, progress, accentColor }: WaveformProps) {
  const { colors } = useTheme();
  const activeColor = accentColor ?? colors.accent;
  const inactiveColor = withAlpha(colors.textSecondary, 0.25);

  const totalWidth = bars.length * (BAR_WIDTH + BAR_GAP) - BAR_GAP;

  const clipRect = useDerivedValue(
    () => rect(0, 0, progress.value * totalWidth, WAVEFORM_HEIGHT),
    [progress, totalWidth],
  );

  const barPositions = useMemo(
    () =>
      bars.map((bar, index) => {
        const barHeight = Math.max(BAR_MIN_HEIGHT, bar.amplitude * WAVEFORM_HEIGHT);
        const x = index * (BAR_WIDTH + BAR_GAP);
        const y = (WAVEFORM_HEIGHT - barHeight) / 2;
        return { x, y, height: barHeight };
      }),
    [bars],
  );

  return (
    <Canvas style={[styles.canvas, { width: totalWidth }]}>
      {barPositions.map((pos, index) => (
        <RoundedRect
          key={index}
          x={pos.x}
          y={pos.y}
          width={BAR_WIDTH}
          height={pos.height}
          r={radius.xs}
          color={inactiveColor}
        />
      ))}
      <Group clip={clipRect}>
        {barPositions.map((pos, index) => (
          <RoundedRect
            key={index}
            x={pos.x}
            y={pos.y}
            width={BAR_WIDTH}
            height={pos.height}
            r={radius.xs}
            color={activeColor}
          />
        ))}
      </Group>
    </Canvas>
  );
}

const styles = StyleSheet.create({
  canvas: {
    height: WAVEFORM_HEIGHT,
  },
});
