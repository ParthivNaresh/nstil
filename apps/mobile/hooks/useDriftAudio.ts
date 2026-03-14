import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";
import type { AVPlaybackStatusSuccess } from "expo-av";
import type { Sound } from "expo-av/build/Audio";
import { useCallback, useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";

import { DRIFT_CONFIG, getDayPhase } from "@/lib/drift";
import type { DayPhase, DriftPhase } from "@/lib/drift";

const AMBIENT_ASSET = require("@/assets/audio/drift-ambient.wav") as number;

const FADE_STEP_MS = 50;
const FADE_IN_DURATION_MS = 1500;
const FADE_OUT_DURATION_MS = 1000;
const FADE_IN_STEP = FADE_STEP_MS / FADE_IN_DURATION_MS;
const FADE_OUT_STEP = FADE_STEP_MS / FADE_OUT_DURATION_MS;

const PHASE_VOLUME: Readonly<Record<DayPhase, number>> = {
  dawn: 0.5,
  day: 0.35,
  dusk: 0.55,
  night: 0.65,
};

const { dayCycleDurationSec } = DRIFT_CONFIG;

interface UseDriftAudioOptions {
  readonly phase: DriftPhase;
  readonly elapsed: number;
}

async function configureDriftAudioMode(): Promise<void> {
  await Audio.setAudioModeAsync({
    playsInSilentModeIOS: false,
    staysActiveInBackground: false,
    shouldDuckAndroid: false,
    interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
    interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
  });
}

export function useDriftAudio({ phase, elapsed }: UseDriftAudioOptions): void {
  const soundRef = useRef<Sound | null>(null);
  const loadingRef = useRef(false);
  const fadeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentVolumeRef = useRef(0);
  const targetVolumeRef = useRef(0);
  const lastPhaseRef = useRef<DayPhase | null>(null);
  const mountedRef = useRef(true);

  const clearFadeTimer = useCallback(() => {
    if (fadeTimerRef.current !== null) {
      clearInterval(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }
  }, []);

  const setVolumeSafe = useCallback(async (volume: number): Promise<void> => {
    const sound = soundRef.current;
    if (!sound) return;
    try {
      const status = await sound.getStatusAsync();
      if (status.isLoaded) {
        await sound.setVolumeAsync(volume);
        currentVolumeRef.current = volume;
      }
    } catch {
      /* sound may have been unloaded */
    }
  }, []);

  const fadeToVolume = useCallback(
    (target: number, stepSize: number) => {
      clearFadeTimer();
      targetVolumeRef.current = target;

      fadeTimerRef.current = setInterval(() => {
        const current = currentVolumeRef.current;
        const diff = targetVolumeRef.current - current;

        if (Math.abs(diff) <= stepSize) {
          clearFadeTimer();
          void setVolumeSafe(targetVolumeRef.current);
          return;
        }

        const next = diff > 0 ? current + stepSize : current - stepSize;
        void setVolumeSafe(next);
      }, FADE_STEP_MS);
    },
    [clearFadeTimer, setVolumeSafe],
  );

  const loadAndPlay = useCallback(async (): Promise<void> => {
    if (loadingRef.current) return;
    loadingRef.current = true;

    try {
      await configureDriftAudioMode();

      const { sound } = await Audio.Sound.createAsync(AMBIENT_ASSET, {
        isLooping: true,
        volume: 0,
        shouldPlay: true,
      });

      if (!mountedRef.current) {
        await sound.unloadAsync();
        return;
      }

      soundRef.current = sound;
      currentVolumeRef.current = 0;
      lastPhaseRef.current = null;

      fadeToVolume(PHASE_VOLUME.dawn, FADE_IN_STEP);
    } catch {
      soundRef.current = null;
    } finally {
      loadingRef.current = false;
    }
  }, [fadeToVolume]);

  const fadeOutAndStop = useCallback(async (): Promise<void> => {
    clearFadeTimer();

    const sound = soundRef.current;
    if (!sound) return;

    targetVolumeRef.current = 0;

    fadeTimerRef.current = setInterval(() => {
      const current = currentVolumeRef.current;
      if (current <= FADE_OUT_STEP) {
        clearFadeTimer();
        void (async () => {
          try {
            await sound.stopAsync();
            await sound.unloadAsync();
          } catch {
            /* already unloaded */
          }
          if (soundRef.current === sound) {
            soundRef.current = null;
          }
        })();
        currentVolumeRef.current = 0;
        return;
      }
      void setVolumeSafe(current - FADE_OUT_STEP);
    }, FADE_STEP_MS);
  }, [clearFadeTimer, setVolumeSafe]);

  useEffect(() => {
    if (phase === "drifting" && !soundRef.current && !loadingRef.current) {
      void loadAndPlay();
    }

    if (phase === "ending" && soundRef.current) {
      void fadeOutAndStop();
    }

    if (phase === "idle" && soundRef.current) {
      clearFadeTimer();
      const sound = soundRef.current;
      soundRef.current = null;
      void sound.unloadAsync().catch(() => {});
    }
  }, [phase, loadAndPlay, fadeOutAndStop, clearFadeTimer]);

  useEffect(() => {
    if (phase !== "drifting") return;

    const dayProgress = (elapsed % dayCycleDurationSec) / dayCycleDurationSec;
    const currentPhase = getDayPhase(dayProgress);

    if (currentPhase !== lastPhaseRef.current) {
      lastPhaseRef.current = currentPhase;
      const target = PHASE_VOLUME[currentPhase];
      fadeToVolume(target, FADE_IN_STEP);
    }
  }, [phase, elapsed, fadeToVolume]);

  useEffect(() => {
    const handleAppState = (nextState: AppStateStatus) => {
      const sound = soundRef.current;
      if (!sound) return;

      if (nextState === "background" || nextState === "inactive") {
        void (async () => {
          try {
            const status = await sound.getStatusAsync();
            if (status.isLoaded && (status as AVPlaybackStatusSuccess).isPlaying) {
              await sound.pauseAsync();
            }
          } catch {
            /* sound may have been unloaded */
          }
        })();
      }

      if (nextState === "active") {
        void (async () => {
          try {
            const status = await sound.getStatusAsync();
            if (status.isLoaded && !(status as AVPlaybackStatusSuccess).isPlaying) {
              await sound.playAsync();
            }
          } catch {
            /* sound may have been unloaded */
          }
        })();
      }
    };

    const subscription = AppState.addEventListener("change", handleAppState);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearFadeTimer();
      const sound = soundRef.current;
      if (sound) {
        soundRef.current = null;
        void sound.unloadAsync().catch(() => {});
      }
    };
  }, [clearFadeTimer]);
}
