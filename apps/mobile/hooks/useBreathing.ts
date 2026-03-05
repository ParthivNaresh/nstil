import { useCallback, useEffect, useRef, useState } from "react";
import {
  Easing,
  cancelAnimation,
  useSharedValue,
  withTiming,
  type EasingFunction,
  type SharedValue,
} from "react-native-reanimated";

import { getBreathingPattern } from "@/lib/breathingPatterns";
import type {
  BreathingPatternConfig,
  BreathingPatternId,
  BreathingPhase,
} from "@/types/breathing";

type BreathingStatus = "idle" | "running" | "paused" | "complete";

interface BreathingState {
  readonly status: BreathingStatus;
  readonly phase: BreathingPhase;
  readonly phaseIndex: number;
  readonly currentCycle: number;
  readonly phaseDuration: number;
}

export interface UseBreathingReturn {
  readonly phase: BreathingPhase;
  readonly phaseSignal: SharedValue<number>;
  readonly phaseIndex: number;
  readonly phaseCount: number;
  readonly phaseDuration: number;
  readonly progress: SharedValue<number>;
  readonly currentCycle: number;
  readonly totalCycles: number;
  readonly isActive: boolean;
  readonly isPaused: boolean;
  readonly isComplete: boolean;
  readonly start: () => void;
  readonly pause: () => void;
  readonly resume: () => void;
  readonly stop: () => void;
}

const INITIAL_PHASE: BreathingPhase = "inhale";
const PHASE_TRANSITION_BUFFER_MS = 50;
const MS_PER_SECOND = 1000;

const PHASE_TO_SIGNAL: Record<BreathingPhase, number> = {
  inhale: 0,
  hold: 1,
  exhale: 2,
  rest: 3,
};

const PHASE_EASING: Record<BreathingPhase, EasingFunction> = {
  inhale: Easing.out(Easing.cubic),
  exhale: Easing.in(Easing.cubic),
  hold: Easing.linear,
  rest: Easing.linear,
};

function getPhaseEasing(pattern: BreathingPatternConfig, phaseIndex: number): EasingFunction {
  const phase = pattern.phases[phaseIndex].phase;
  return PHASE_EASING[phase];
}

function buildInitialState(pattern: BreathingPatternConfig): BreathingState {
  return {
    status: "idle",
    phase: INITIAL_PHASE,
    phaseIndex: 0,
    currentCycle: 0,
    phaseDuration: pattern.phases[0].duration,
  };
}

export function useBreathing(
  patternId: BreathingPatternId,
  totalCycles: number,
): UseBreathingReturn {
  const pattern = getBreathingPattern(patternId);
  const [state, setState] = useState<BreathingState>(() => buildInitialState(pattern));
  const stateRef = useRef(state);
  stateRef.current = state;

  const progress = useSharedValue(0);
  const phaseSignal = useSharedValue(PHASE_TO_SIGNAL[INITIAL_PHASE]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const patternRef = useRef(pattern);
  patternRef.current = pattern;
  const totalCyclesRef = useRef(totalCycles);
  totalCyclesRef.current = totalCycles;

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const advanceToNextPhase = useCallback(
    (phaseIndex: number, cycle: number) => {
      const pat = patternRef.current;
      const cycles = totalCyclesRef.current;
      const nextPhaseIndex = phaseIndex + 1;

      if (nextPhaseIndex < pat.phases.length) {
        const next = pat.phases[nextPhaseIndex];
        setState({
          status: "running",
          phase: next.phase,
          phaseIndex: nextPhaseIndex,
          currentCycle: cycle,
          phaseDuration: next.duration,
        });
        return { phaseIndex: nextPhaseIndex, cycle, durationMs: next.duration * MS_PER_SECOND };
      }

      const nextCycle = cycle + 1;
      if (nextCycle < cycles) {
        const first = pat.phases[0];
        setState({
          status: "running",
          phase: first.phase,
          phaseIndex: 0,
          currentCycle: nextCycle,
          phaseDuration: first.duration,
        });
        return { phaseIndex: 0, cycle: nextCycle, durationMs: first.duration * MS_PER_SECOND };
      }

      cancelAnimation(progress);
      progress.value = 1;
      setState((prev) => ({
        ...prev,
        status: "complete",
        currentCycle: nextCycle,
      }));
      return null;
    },
    [progress],
  );

  const runPhase = useCallback(
    (phaseIndex: number, cycle: number, durationMs: number) => {
      const pat = patternRef.current;
      const easing = getPhaseEasing(pat, phaseIndex);
      phaseSignal.value = PHASE_TO_SIGNAL[pat.phases[phaseIndex].phase];
      progress.value = 0;
      progress.value = withTiming(1, {
        duration: durationMs,
        easing,
      });

      timerRef.current = setTimeout(() => {
        if (!mountedRef.current) return;

        const next = advanceToNextPhase(phaseIndex, cycle);
        if (next) {
          runPhase(next.phaseIndex, next.cycle, next.durationMs);
        }
      }, durationMs + PHASE_TRANSITION_BUFFER_MS);
    },
    [progress, phaseSignal, advanceToNextPhase],
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearTimer();
      cancelAnimation(progress);
    };
  }, [progress, clearTimer]);

  const start = useCallback(() => {
    clearTimer();
    cancelAnimation(progress);

    const firstPhase = pattern.phases[0];
    const nextState: BreathingState = {
      status: "running",
      phase: firstPhase.phase,
      phaseIndex: 0,
      currentCycle: 0,
      phaseDuration: firstPhase.duration,
    };
    setState(nextState);
    stateRef.current = nextState;

    runPhase(0, 0, firstPhase.duration * MS_PER_SECOND);
  }, [pattern, clearTimer, progress, runPhase]);

  const pause = useCallback(() => {
    clearTimer();
    cancelAnimation(progress);
    setState((prev) => ({ ...prev, status: "paused" }));
  }, [clearTimer, progress]);

  const resume = useCallback(() => {
    const current = stateRef.current;
    if (current.status !== "paused") return;

    setState((prev) => ({ ...prev, status: "running" }));

    const remainingFraction = 1 - progress.value;
    const remainingMs = remainingFraction * current.phaseDuration * MS_PER_SECOND;

    if (remainingMs <= 0) {
      const next = advanceToNextPhase(current.phaseIndex, current.currentCycle);
      if (next) {
        runPhase(next.phaseIndex, next.cycle, next.durationMs);
      }
      return;
    }

    progress.value = withTiming(1, {
      duration: remainingMs,
      easing: Easing.linear,
    });

    timerRef.current = setTimeout(() => {
      if (!mountedRef.current) return;

      const next = advanceToNextPhase(current.phaseIndex, current.currentCycle);
      if (next) {
        runPhase(next.phaseIndex, next.cycle, next.durationMs);
      }
    }, remainingMs + PHASE_TRANSITION_BUFFER_MS);
  }, [progress, advanceToNextPhase, runPhase]);

  const stop = useCallback(() => {
    clearTimer();
    cancelAnimation(progress);
    phaseSignal.value = PHASE_TO_SIGNAL[INITIAL_PHASE];
    progress.value = 0;
    setState(buildInitialState(pattern));
  }, [pattern, clearTimer, progress, phaseSignal]);

  return {
    phase: state.phase,
    phaseSignal,
    phaseIndex: state.phaseIndex,
    phaseCount: pattern.phases.length,
    phaseDuration: state.phaseDuration,
    progress,
    currentCycle: state.currentCycle,
    totalCycles,
    isActive: state.status === "running",
    isPaused: state.status === "paused",
    isComplete: state.status === "complete",
    start,
    pause,
    resume,
    stop,
  };
}
