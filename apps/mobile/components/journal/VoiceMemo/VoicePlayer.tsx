import * as Haptics from "expo-haptics";
import { Pause, Play, Trash2 } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import type { AVPlaybackStatus, AVPlaybackStatusSuccess } from "expo-av";
import type { Sound } from "expo-av/build/Audio";
import { useSharedValue, withTiming } from "react-native-reanimated";

import { AppText, Icon } from "@/components/ui";
import { useTheme } from "@/hooks/useTheme";
import {
  createSoundFromUri,
  downsampleAmplitudes,
  formatDuration,
  resetAudioSession,
} from "@/lib/audioUtils";
import { withAlpha } from "@/lib/colorUtils";
import { duration as animDuration, radius, spacing } from "@/styles";

import { Waveform } from "./Waveform";
import type { WaveformBarData } from "./types";

const TARGET_BAR_COUNT = 50;
const PLAYBACK_UPDATE_INTERVAL_MS = 100;

function amplitudesToBars(amplitudes: readonly number[], maxBars: number): WaveformBarData[] {
  const downsampled = downsampleAmplitudes(amplitudes, maxBars);
  return downsampled.map((amplitude) => ({ amplitude }));
}

interface VoicePlayerProps {
  readonly uri: string;
  readonly durationMs: number;
  readonly waveform?: readonly number[];
  readonly onRemove: () => void;
}

export function VoicePlayer({ uri, durationMs, waveform, onRemove }: VoicePlayerProps) {
  const { colors } = useTheme();
  const [isPlaying, setIsPlaying] = useState(false);
  const [positionMs, setPositionMs] = useState(0);
  const animatedProgress = useSharedValue(0);

  const bars = useMemo<WaveformBarData[]>(
    () =>
      waveform && waveform.length > 0
        ? amplitudesToBars(waveform, TARGET_BAR_COUNT)
        : [],
    [waveform],
  );

  const soundRef = useRef<Sound | null>(null);

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        void soundRef.current.unloadAsync().catch(() => {});
      }
    };
  }, []);

  const handlePlaybackStatus = useCallback(
    (status: AVPlaybackStatus) => {
      if (!status.isLoaded) return;
      const loaded = status as AVPlaybackStatusSuccess;

      setPositionMs(loaded.positionMillis);
      setIsPlaying(loaded.isPlaying);

      const targetProgress = durationMs > 0 ? loaded.positionMillis / durationMs : 0;
      animatedProgress.value = withTiming(targetProgress, {
        duration: PLAYBACK_UPDATE_INTERVAL_MS,
      });

      if (loaded.didJustFinish) {
        setIsPlaying(false);
        setPositionMs(0);
        animatedProgress.value = withTiming(0, { duration: animDuration.fast });
        void soundRef.current?.setPositionAsync(0).catch(() => {});
      }
    },
    [durationMs, animatedProgress],
  );

  const handleTogglePlay = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (soundRef.current) {
      const status = await soundRef.current.getStatusAsync();
      if (status.isLoaded && status.isPlaying) {
        await soundRef.current.pauseAsync();
        return;
      }
      if (status.isLoaded) {
        await soundRef.current.playAsync();
        return;
      }
    }

    await resetAudioSession();
    const sound = await createSoundFromUri(uri);
    soundRef.current = sound;
    sound.setOnPlaybackStatusUpdate(handlePlaybackStatus);
    await sound.setProgressUpdateIntervalAsync(PLAYBACK_UPDATE_INTERVAL_MS);
    await sound.playAsync();
  }, [uri, handlePlaybackStatus]);

  const handleRemove = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync().catch(() => {});
      await soundRef.current.unloadAsync().catch(() => {});
      soundRef.current = null;
    }
    setIsPlaying(false);
    setPositionMs(0);
    animatedProgress.value = 0;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onRemove();
  }, [onRemove, animatedProgress]);

  const displayDuration = isPlaying ? positionMs : durationMs;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: withAlpha(colors.accent, 0.06),
          borderColor: withAlpha(colors.accent, 0.15),
        },
      ]}
    >
      <View style={styles.row}>
        <Pressable
          onPress={handleTogglePlay}
          style={[styles.playButton, { backgroundColor: withAlpha(colors.accent, 0.15) }]}
          accessibilityLabel={isPlaying ? "Pause" : "Play"}
        >
          <Icon
            icon={isPlaying ? Pause : Play}
            size="sm"
            color={colors.accent}
          />
        </Pressable>
        <View style={styles.waveformContainer}>
          {bars.length > 0 ? (
            <Waveform bars={bars} progress={animatedProgress} />
          ) : null}
        </View>
        <AppText variant="caption" color={colors.textSecondary}>
          {formatDuration(displayDuration)}
        </AppText>
        <Pressable
          onPress={handleRemove}
          hitSlop={8}
          accessibilityLabel="Remove voice memo"
        >
          <Icon icon={Trash2} size="sm" color={colors.textTertiary} />
        </Pressable>
      </View>
    </View>
  );
}

const PLAY_BUTTON_SIZE = 36;

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.sm + 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  playButton: {
    width: PLAY_BUTTON_SIZE,
    height: PLAY_BUTTON_SIZE,
    borderRadius: PLAY_BUTTON_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  waveformContainer: {
    flex: 1,
    overflow: "hidden",
  },
});
