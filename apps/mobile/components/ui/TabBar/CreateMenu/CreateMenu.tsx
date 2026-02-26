import {
  Blur,
  Canvas,
  LinearGradient,
  Path,
  vec,
} from "@shopify/react-native-skia";
import { BookOpen, PenLine } from "lucide-react-native";
import { useCallback, useEffect, useMemo } from "react";
import { Pressable, StyleSheet } from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useTranslation } from "react-i18next";

import { useTheme } from "@/hooks/useTheme";
import { withAlpha } from "@/lib/colorUtils";

import { ARC_FRAMES, DIVIDER_FRAME_THRESHOLD, DIVIDER_PATH, FRAME_COUNT } from "./arcPath";
import { CreateMenuItem } from "./CreateMenuItem";
import {
  ARC_START_DEG,
  ARC_SWEEP_DEG,
  BACKDROP_OPACITY,
  CANVAS_SIZE,
  ITEM_RADIUS,
  SCREEN_CENTER_X,
} from "./styles";
import type { CreateMenuProps } from "./types";

const OPEN_DURATION = 280;
const CLOSE_DURATION = 200;
const OPEN_EASING = Easing.out(Easing.cubic);
const CLOSE_EASING = Easing.in(Easing.cubic);
const DEG_TO_RAD = Math.PI / 180;
const GLOW_BLUR = 8;
const BORDER_WIDTH = 1;
const GLOW_STROKE_WIDTH = 3;

interface ItemPosition {
  readonly x: number;
  readonly y: number;
  readonly fraction: number;
}

function computeItemPositions(count: number): ItemPosition[] {
  const cx = CANVAS_SIZE / 2;
  const cy = CANVAS_SIZE / 2;
  const positions: ItemPosition[] = [];
  for (let i = 0; i < count; i++) {
    const fraction = (i + 1) / (count + 1);
    const angleDeg = ARC_START_DEG + ARC_SWEEP_DEG * fraction;
    const angleRad = angleDeg * DEG_TO_RAD;
    positions.push({
      x: cx + ITEM_RADIUS * Math.cos(angleRad),
      y: cy + ITEM_RADIUS * Math.sin(angleRad),
      fraction,
    });
  }
  return positions;
}

export function CreateMenu({
  visible,
  onClose,
  onNewEntry,
  onNewJournal,
  anchorY,
}: CreateMenuProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const progress = useSharedValue(0);
  const backdropOpacity = useSharedValue(0);
  const mounted = useSharedValue(false);

  useEffect(() => {
    if (visible) {
      mounted.value = true;
      backdropOpacity.value = withTiming(BACKDROP_OPACITY, { duration: OPEN_DURATION });
      progress.value = withTiming(1, { duration: OPEN_DURATION, easing: OPEN_EASING });
    } else {
      backdropOpacity.value = withTiming(0, { duration: CLOSE_DURATION });
      progress.value = withTiming(0, { duration: CLOSE_DURATION, easing: CLOSE_EASING }, (finished) => {
        if (finished) {
          mounted.value = false;
        }
      });
    }
  }, [visible, progress, backdropOpacity, mounted]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
    pointerEvents: mounted.value ? ("auto" as const) : ("none" as const),
  }));

  const canvasLeft = SCREEN_CENTER_X - CANVAS_SIZE / 2;
  const canvasTop = anchorY - CANVAS_SIZE / 2;

  const containerStyle = useAnimatedStyle(() => ({
    pointerEvents: mounted.value ? ("auto" as const) : ("none" as const),
  }));

  const frameIndex = useDerivedValue(() => {
    "worklet";
    return Math.round(progress.value * FRAME_COUNT);
  });

  const arcPath = useDerivedValue(() => {
    "worklet";
    return ARC_FRAMES[frameIndex.value] ?? "";
  });

  const dividerOpacity = useDerivedValue(() => {
    "worklet";
    if (frameIndex.value < DIVIDER_FRAME_THRESHOLD) return 0;
    const past = frameIndex.value - DIVIDER_FRAME_THRESHOLD;
    const fadeFrames = 6;
    return Math.min(past / fadeFrames, 1);
  });

  const animateClose = useCallback(
    (onComplete: () => void) => {
      progress.value = withTiming(0, { duration: CLOSE_DURATION, easing: CLOSE_EASING });
      backdropOpacity.value = withTiming(0, { duration: CLOSE_DURATION }, (finished) => {
        if (finished) {
          mounted.value = false;
          runOnJS(onComplete)();
        }
      });
    },
    [progress, backdropOpacity, mounted],
  );

  const handleNewEntry = useCallback(() => {
    animateClose(onNewEntry);
  }, [animateClose, onNewEntry]);

  const handleNewJournal = useCallback(() => {
    animateClose(onNewJournal);
  }, [animateClose, onNewJournal]);

  const positions = useMemo(() => computeItemPositions(2), []);

  const glassFill = colors.glass;
  const borderColor = colors.glassBorder;
  const glowColor = withAlpha(colors.accent, 0.12);
  const gradientStart = withAlpha(colors.accent, 0.08);
  const gradientEnd = withAlpha(colors.accentLight, 0.04);

  const item0Style = useAnimatedStyle(() => {
    const reveal = progress.value / positions[0].fraction;
    return { opacity: Math.min(Math.max(reveal - 0.5, 0) * 2, 1) };
  });

  const item1Style = useAnimatedStyle(() => {
    const reveal = progress.value / positions[1].fraction;
    return { opacity: Math.min(Math.max(reveal - 0.5, 0) * 2, 1) };
  });

  const half = CANVAS_SIZE / 2;

  return (
    <>
      <Animated.View style={[localStyles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      <Animated.View
        style={[
          localStyles.arcContainer,
          { left: canvasLeft, top: canvasTop, width: CANVAS_SIZE, height: CANVAS_SIZE },
          containerStyle,
        ]}
      >
        <Canvas style={localStyles.canvas} pointerEvents="none">
          <Path path={arcPath} color={glassFill} />

          <Path path={arcPath}>
            <LinearGradient
              start={vec(0, 0)}
              end={vec(CANVAS_SIZE, half)}
              colors={[gradientStart, gradientEnd]}
            />
          </Path>

          <Path
            path={arcPath}
            style="stroke"
            strokeWidth={GLOW_STROKE_WIDTH}
            color={glowColor}
          >
            <Blur blur={GLOW_BLUR} />
          </Path>

          <Path
            path={arcPath}
            style="stroke"
            strokeWidth={BORDER_WIDTH}
            color={borderColor}
          />

          <Path
            path={DIVIDER_PATH}
            style="stroke"
            strokeWidth={BORDER_WIDTH}
            color={borderColor}
            opacity={dividerOpacity}
          />
        </Canvas>
        <Animated.View style={[localStyles.itemWrapper, item0Style]} pointerEvents="box-none">
          <CreateMenuItem
            label={t("createMenu.newJournal")}
            icon={BookOpen}
            onPress={handleNewJournal}
            centerX={positions[0].x}
            centerY={positions[0].y}
          />
        </Animated.View>
        <Animated.View style={[localStyles.itemWrapper, item1Style]} pointerEvents="box-none">
          <CreateMenuItem
            label={t("createMenu.newEntry")}
            icon={PenLine}
            onPress={handleNewEntry}
            centerX={positions[1].x}
            centerY={positions[1].y}
          />
        </Animated.View>
      </Animated.View>
    </>
  );
}

const localStyles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "black",
  },
  arcContainer: {
    position: "absolute",
  },
  canvas: {
    ...StyleSheet.absoluteFillObject,
  },
  itemWrapper: {
    ...StyleSheet.absoluteFillObject,
  },
});
