import { Canvas, Fill, Shader } from "@shopify/react-native-skia";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { LayoutChangeEvent } from "react-native";
import { StyleSheet, View } from "react-native";
import {
  cancelAnimation,
  Easing,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { useTheme } from "@/hooks/useTheme";
import { useThemeStore } from "@/stores/themeStore";

import { getAmbientColors } from "./ambientColors";
import { ambientShader } from "./shader";
import type { AmbientBackgroundProps } from "./types";

const CYCLE_DURATION_MS = 120_000;
const CYCLE_MAX = 1000;
const MOUNT_DELAY_MS = 100;

function useActiveCustomAmbient() {
  const customThemes = useThemeStore((s) => s.customThemes);
  const activeCustomId = useThemeStore((s) => s.activeCustomId);

  return useMemo(() => {
    if (!activeCustomId) return null;
    const theme = customThemes.find((t) => t.id === activeCustomId);
    return theme?.built.ambient ?? null;
  }, [customThemes, activeCustomId]);
}

export function AmbientBackground({ style }: AmbientBackgroundProps) {
  const { mode, isDark } = useTheme();
  const customAmbient = useActiveCustomAmbient();
  const [canRender, setCanRender] = useState(false);
  const [hasLayout, setHasLayout] = useState(false);

  const width = useSharedValue(0);
  const height = useSharedValue(0);
  const time = useSharedValue(0);

  const c1r = useSharedValue(0);
  const c1g = useSharedValue(0);
  const c1b = useSharedValue(0);
  const c1a = useSharedValue(1);
  const c2r = useSharedValue(0);
  const c2g = useSharedValue(0);
  const c2b = useSharedValue(0);
  const c2a = useSharedValue(1);
  const c3r = useSharedValue(0);
  const c3g = useSharedValue(0);
  const c3b = useSharedValue(0);
  const c3a = useSharedValue(1);

  const onLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const layout = event.nativeEvent.layout;
      width.value = layout.width;
      height.value = layout.height;
      setHasLayout(true);
    },
    [width, height],
  );

  useEffect(() => {
    const timer = setTimeout(() => setCanRender(true), MOUNT_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    time.value = withRepeat(
      withTiming(CYCLE_MAX, {
        duration: CYCLE_DURATION_MS,
        easing: Easing.linear,
      }),
      -1,
      false,
    );
    return () => cancelAnimation(time);
  }, [time]);

  const colorSet = useMemo(
    () => getAmbientColors(mode, isDark, customAmbient),
    [mode, isDark, customAmbient],
  );

  useEffect(() => {
    c1r.value = colorSet.color1[0];
    c1g.value = colorSet.color1[1];
    c1b.value = colorSet.color1[2];
    c1a.value = colorSet.color1[3];
    c2r.value = colorSet.color2[0];
    c2g.value = colorSet.color2[1];
    c2b.value = colorSet.color2[2];
    c2a.value = colorSet.color2[3];
    c3r.value = colorSet.color3[0];
    c3g.value = colorSet.color3[1];
    c3b.value = colorSet.color3[2];
    c3a.value = colorSet.color3[3];
  }, [colorSet, c1r, c1g, c1b, c1a, c2r, c2g, c2b, c2a, c3r, c3g, c3b, c3a]);

  const uniforms = useDerivedValue(() => ({
    uResolution: [width.value, height.value] as const,
    uTime: time.value,
    uColor1: [c1r.value, c1g.value, c1b.value, c1a.value] as const,
    uColor2: [c2r.value, c2g.value, c2b.value, c2a.value] as const,
    uColor3: [c3r.value, c3g.value, c3b.value, c3a.value] as const,
  }));

  if (!ambientShader) {
    return null;
  }

  return (
    <View style={[styles.container, style]} onLayout={onLayout}>
      {canRender && hasLayout ? (
        <Canvas style={styles.canvas}>
          <Fill>
            <Shader source={ambientShader} uniforms={uniforms} />
          </Fill>
        </Canvas>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  canvas: {
    flex: 1,
  },
});
