import { useCallback, useEffect, useRef, useState } from "react";
import { AccessibilityInfo, AppState, type AppStateStatus } from "react-native";
import {
  cancelAnimation,
  Easing,
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";

import { clamp } from "@/lib/animation";
import { DRIFT_CONFIG } from "@/lib/drift";
import type { DriftPhase } from "@/lib/drift";

const {
  scrollSpeedPxPerSec,
  terrainLoopWidth,
  dayCycleDurationSec,
  defaultSessionDurationSec,
  player,
} = DRIFT_CONFIG;

const MS_PER_SEC = 1000;
const TIME_CYCLE_SEC = 3600;
const ELAPSED_UPDATE_INTERVAL_MS = 1000;
const REDUCED_MOTION_SPEED_FACTOR = 0.5;
const VELOCITY_SMOOTHING_TAU = 0.15;

export interface UseDriftReturn {
  readonly phase: DriftPhase;
  readonly time: SharedValue<number>;
  readonly playerY: SharedValue<number>;
  readonly isTouching: SharedValue<number>;
  readonly canvasHeight: SharedValue<number>;
  readonly scrollX: Readonly<SharedValue<number>>;
  readonly dayProgress: Readonly<SharedValue<number>>;
  readonly elapsed: number;
  readonly reduceMotion: boolean;
  readonly start: () => void;
  readonly stop: () => void;
}

export function useDrift(): UseDriftReturn {
  const [phase, setPhase] = useState<DriftPhase>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  const time = useSharedValue(0);
  const playerY = useSharedValue(0);
  const isTouching = useSharedValue(0);
  const isDrifting = useSharedValue(0);
  const canvasHeight = useSharedValue(0);
  const velocityY = useSharedValue(0);

  const startWallTimeRef = useRef<number | null>(null);
  const pausedElapsedRef = useRef(0);
  const elapsedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseRef = useRef<DriftPhase>("idle");
  const mountedRef = useRef(true);

  const speedFactor = reduceMotion ? REDUCED_MOTION_SPEED_FACTOR : 1;
  const effectiveSpeed = scrollSpeedPxPerSec * speedFactor;

  const scrollX = useDerivedValue(() => {
    const raw = (time.value * effectiveSpeed) % terrainLoopWidth;
    return raw < 0 ? raw + terrainLoopWidth : raw;
  });

  const dayProgress = useDerivedValue(
    () => (time.value % dayCycleDurationSec) / dayCycleDurationSec,
  );

  useAnimatedReaction(
    () => time.value,
    (current, previous) => {
      if (isDrifting.value !== 1 || previous === null || canvasHeight.value <= 0) return;

      const dt = current - previous;
      if (dt <= 0 || dt > 0.5) return;

      const targetVy = isTouching.value === 1 ? player.gravity : -player.buoyancy;
      const alpha = 1 - Math.exp(-dt / VELOCITY_SMOOTHING_TAU);
      velocityY.value = velocityY.value + (targetVy - velocityY.value) * alpha;

      const minYpx = canvasHeight.value * player.minY;
      const maxYpx = canvasHeight.value * player.maxYFraction;

      playerY.value = clamp(playerY.value + velocityY.value * dt, minYpx, maxYpx);
    },
  );

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mountedRef.current) setReduceMotion(enabled);
    });

    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      (enabled: boolean) => {
        if (mountedRef.current) setReduceMotion(enabled);
      },
    );

    return () => subscription.remove();
  }, []);

  const clearElapsedTimer = useCallback(() => {
    if (elapsedTimerRef.current !== null) {
      clearInterval(elapsedTimerRef.current);
      elapsedTimerRef.current = null;
    }
  }, []);

  const startElapsedTimer = useCallback(() => {
    clearElapsedTimer();
    elapsedTimerRef.current = setInterval(() => {
      if (!mountedRef.current || startWallTimeRef.current === null) return;
      const now = Date.now();
      const totalMs = now - startWallTimeRef.current + pausedElapsedRef.current;
      setElapsed(Math.floor(totalMs / MS_PER_SEC));
    }, ELAPSED_UPDATE_INTERVAL_MS);
  }, [clearElapsedTimer]);

  const startTimeAnimation = useCallback(() => {
    const remaining = TIME_CYCLE_SEC - time.value;
    const remainingMs = remaining * MS_PER_SEC;
    time.value = withTiming(time.value + remaining, {
      duration: remainingMs,
      easing: Easing.linear,
    });
  }, [time]);

  const start = useCallback(() => {
    if (phaseRef.current === "drifting") return;

    phaseRef.current = "drifting";
    setPhase("drifting");
    setElapsed(0);
    pausedElapsedRef.current = 0;
    startWallTimeRef.current = Date.now();

    time.value = 0;
    velocityY.value = 0;
    isTouching.value = 0;

    const midFraction = (player.minY + player.maxYFraction) / 2;
    playerY.value = canvasHeight.value > 0 ? canvasHeight.value * midFraction : 0;

    isDrifting.value = 1;

    startTimeAnimation();
    startElapsedTimer();
  }, [time, playerY, isTouching, isDrifting, velocityY, canvasHeight, startTimeAnimation, startElapsedTimer]);

  const stop = useCallback(() => {
    phaseRef.current = "ending";
    setPhase("ending");
    clearElapsedTimer();
    cancelAnimation(time);

    startWallTimeRef.current = null;
    pausedElapsedRef.current = 0;
    isTouching.value = 0;
    isDrifting.value = 0;
    velocityY.value = 0;

    setTimeout(() => {
      if (!mountedRef.current) return;
      phaseRef.current = "idle";
      setPhase("idle");
      time.value = 0;

      const midFraction = (player.minY + player.maxYFraction) / 2;
      playerY.value = canvasHeight.value > 0 ? canvasHeight.value * midFraction : 0;
    }, 0);
  }, [time, playerY, isTouching, isDrifting, velocityY, canvasHeight, clearElapsedTimer]);

  useEffect(() => {
    const handleAppState = (nextState: AppStateStatus) => {
      if (phaseRef.current !== "drifting") return;

      if (nextState === "background" || nextState === "inactive") {
        cancelAnimation(time);
        clearElapsedTimer();

        if (startWallTimeRef.current !== null) {
          pausedElapsedRef.current += Date.now() - startWallTimeRef.current;
          startWallTimeRef.current = null;
        }
      }

      if (nextState === "active" && startWallTimeRef.current === null) {
        startWallTimeRef.current = Date.now();
        startTimeAnimation();
        startElapsedTimer();
      }
    };

    const subscription = AppState.addEventListener("change", handleAppState);
    return () => subscription.remove();
  }, [time, clearElapsedTimer, startTimeAnimation, startElapsedTimer]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearElapsedTimer();
      cancelAnimation(time);
    };
  }, [time, clearElapsedTimer]);

  useEffect(() => {
    if (phase === "drifting" && elapsed >= defaultSessionDurationSec) {
      stop();
    }
  }, [phase, elapsed, stop]);

  return {
    phase,
    time,
    playerY,
    isTouching,
    canvasHeight,
    scrollX,
    dayProgress,
    elapsed,
    reduceMotion,
    start,
    stop,
  };
}
