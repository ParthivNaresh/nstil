import * as Haptics from "expo-haptics";
import { Mic, Square, Trash2 } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import type { Recording, RecordingStatus as AVRecordingStatus } from "expo-av/build/Audio";

import { AppText, Icon } from "@/components/ui";
import { useTheme } from "@/hooks/useTheme";
import {
  AUDIO_CONSTANTS,
  configureAudioSession,
  createRecording,
  formatDuration,
  normalizeMetering,
  requestMicrophonePermission,
  resetAudioSession,
} from "@/lib/audioUtils";
import { withAlpha } from "@/lib/colorUtils";
import { radius, spacing } from "@/styles";
import type { AudioContentType, LocalAudio } from "@/types";

import { WaveformStatic } from "./Waveform";
import type { WaveformBarData } from "./types";

const MAX_BARS = 50;
const MIN_RECORDING_MS = 500;

interface VoiceRecorderInlineProps {
  readonly onPress: () => void;
}

export function VoiceRecorderInline({ onPress }: VoiceRecorderInlineProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityLabel="Record voice memo"
    >
      <Icon icon={Mic} size="sm" color={colors.textTertiary} />
    </Pressable>
  );
}

interface VoiceRecorderActiveProps {
  readonly onRecordingComplete: (audio: LocalAudio) => void;
  readonly onCancel: () => void;
}

export function VoiceRecorderActive({ onRecordingComplete, onCancel }: VoiceRecorderActiveProps) {
  const { colors } = useTheme();
  const [durationMs, setDurationMs] = useState(0);
  const [bars, setBars] = useState<WaveformBarData[]>([]);

  const recordingRef = useRef<Recording | null>(null);
  const barsRef = useRef<WaveformBarData[]>([]);
  const allAmplitudesRef = useRef<number[]>([]);
  const durationRef = useRef(0);
  const startTimeRef = useRef(0);
  const stoppingRef = useRef(false);
  const onCompleteRef = useRef(onRecordingComplete);
  const onCancelRef = useRef(onCancel);

  onCompleteRef.current = onRecordingComplete;
  onCancelRef.current = onCancel;

  const finishRecording = useCallback(async () => {
    if (stoppingRef.current) return;
    stoppingRef.current = true;

    const recording = recordingRef.current;
    if (!recording) {
      onCancelRef.current();
      return;
    }
    recordingRef.current = null;

    const capturedDuration = durationRef.current;

    try {
      await recording.stopAndUnloadAsync();
    } catch {
      // already stopped
    }

    await resetAudioSession();

    const uri = recording.getURI();

    if (uri && capturedDuration > MIN_RECORDING_MS) {
      const timestamp = Date.now();
      const fileName = `voice_${timestamp}.m4a`;
      const contentType: AudioContentType = "audio/m4a";

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onCompleteRef.current({
        uri,
        fileName,
        contentType,
        durationMs: capturedDuration,
        waveform: allAmplitudesRef.current,
      });
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      onCancelRef.current();
    }
  }, []);

  const handleRecordingStatus = useCallback((status: AVRecordingStatus) => {
    if (!status.isRecording) return;

    const elapsed = status.durationMillis > 0
      ? status.durationMillis
      : Date.now() - startTimeRef.current;

    durationRef.current = elapsed;
    setDurationMs(elapsed);

    if (status.metering != null) {
      const amplitude = normalizeMetering(status.metering);
      allAmplitudesRef.current.push(amplitude);
      const newBar: WaveformBarData = { amplitude };
      const updated = [...barsRef.current, newBar].slice(-MAX_BARS);
      barsRef.current = updated;
      setBars(updated);
    }

    if (elapsed >= AUDIO_CONSTANTS.maxDurationMs) {
      void finishRecording();
    }
  }, [finishRecording]);

  useEffect(() => {
    let mounted = true;

    async function start() {
      const granted = await requestMicrophonePermission();
      if (!granted || !mounted) {
        if (mounted) {
          Alert.alert(
            "Microphone Access",
            "NStil needs microphone access to record voice memos. Please enable it in Settings.",
          );
          onCancelRef.current();
        }
        return;
      }

      await configureAudioSession();
      const recording = await createRecording();

      if (!mounted) {
        await recording.stopAndUnloadAsync().catch(() => {});
        await resetAudioSession();
        return;
      }

      startTimeRef.current = Date.now();
      recordingRef.current = recording;
      recording.setOnRecordingStatusUpdate(handleRecordingStatus);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    void start();

    return () => {
      mounted = false;
      if (recordingRef.current && !stoppingRef.current) {
        const rec = recordingRef.current;
        recordingRef.current = null;
        void rec.stopAndUnloadAsync().catch(() => {});
        void resetAudioSession().catch(() => {});
      }
    };
  }, [handleRecordingStatus]);

  const handleDiscard = useCallback(async () => {
    if (stoppingRef.current) return;
    stoppingRef.current = true;

    const recording = recordingRef.current;
    if (!recording) return;
    recordingRef.current = null;

    try {
      await recording.stopAndUnloadAsync();
    } catch {
      // already stopped
    }
    await resetAudioSession();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onCancelRef.current();
  }, []);

  return (
    <View
      style={[
        styles.recordingContainer,
        {
          backgroundColor: withAlpha(colors.accent, 0.08),
          borderColor: withAlpha(colors.accent, 0.2),
        },
      ]}
    >
      <View style={styles.recordingHeader}>
        <View style={styles.recordingIndicator}>
          <View style={[styles.recordingDot, { backgroundColor: colors.accent }]} />
          <AppText variant="caption" color={colors.accent}>
            {formatDuration(durationMs)}
          </AppText>
        </View>
        <View style={styles.recordingActions}>
          <Pressable
            onPress={handleDiscard}
            hitSlop={8}
            accessibilityLabel="Discard recording"
          >
            <Icon icon={Trash2} size="sm" color={colors.textTertiary} />
          </Pressable>
          <Pressable
            onPress={finishRecording}
            style={[styles.stopButton, { backgroundColor: colors.accent }]}
            accessibilityLabel="Stop recording"
          >
            <Icon icon={Square} size="xs" color={colors.onError} />
          </Pressable>
        </View>
      </View>
      {bars.length > 0 ? <WaveformStatic bars={bars} accentColor={colors.accent} /> : null}
    </View>
  );
}

const STOP_BUTTON_SIZE = 32;

const styles = StyleSheet.create({
  recordingContainer: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm,
  },
  recordingHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  recordingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  recordingActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  stopButton: {
    width: STOP_BUTTON_SIZE,
    height: STOP_BUTTON_SIZE,
    borderRadius: STOP_BUTTON_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
});
