import { Audio } from "expo-av";
import type { Recording, Sound } from "expo-av/build/Audio";

import type { AudioContentType } from "@/types";

const MAX_DURATION_MS = 5 * 60 * 1000;
const METERING_INTERVAL_MS = 100;

export const AUDIO_CONSTANTS = {
  maxDurationMs: MAX_DURATION_MS,
  meteringIntervalMs: METERING_INTERVAL_MS,
} as const;

export type RecordingStatus = "idle" | "recording" | "paused" | "stopped";

export interface RecordingResult {
  readonly uri: string;
  readonly durationMs: number;
  readonly fileName: string;
  readonly contentType: AudioContentType;
}

export async function requestMicrophonePermission(): Promise<boolean> {
  const { status } = await Audio.requestPermissionsAsync();
  return status === "granted";
}

export async function checkMicrophonePermission(): Promise<boolean> {
  const { status } = await Audio.getPermissionsAsync();
  return status === "granted";
}

export async function configureAudioSession(): Promise<void> {
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
    staysActiveInBackground: false,
  });
}

export async function resetAudioSession(): Promise<void> {
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    playsInSilentModeIOS: true,
    staysActiveInBackground: false,
  });
}

const RECORDING_OPTIONS = {
  isMeteringEnabled: true,
  android: {
    extension: ".m4a",
    outputFormat: Audio.AndroidOutputFormat.MPEG_4,
    audioEncoder: Audio.AndroidAudioEncoder.AAC,
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 128000,
  },
  ios: {
    extension: ".m4a",
    outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
    audioQuality: Audio.IOSAudioQuality.HIGH,
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 128000,
  },
  web: {},
} as const;

export async function createRecording(): Promise<Recording> {
  const recording = new Audio.Recording();
  await recording.prepareToRecordAsync(RECORDING_OPTIONS);
  recording.setProgressUpdateInterval(METERING_INTERVAL_MS);
  await recording.startAsync();
  return recording;
}

export async function stopRecording(recording: Recording): Promise<RecordingResult | null> {
  try {
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    if (!uri) return null;

    const status = await recording.getStatusAsync();
    const durationMs = status.durationMillis ?? 0;

    const timestamp = Date.now();
    const fileName = `voice_${timestamp}.m4a`;

    return {
      uri,
      durationMs,
      fileName,
      contentType: "audio/m4a",
    };
  } catch {
    return null;
  }
}

export async function createSoundFromUri(uri: string): Promise<Sound> {
  const { sound } = await Audio.Sound.createAsync({ uri });
  return sound;
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function normalizeMetering(db: number): number {
  const MIN_DB = -60;
  const MAX_DB = 0;
  const clamped = Math.max(MIN_DB, Math.min(MAX_DB, db));
  return (clamped - MIN_DB) / (MAX_DB - MIN_DB);
}

export function downsampleAmplitudes(
  amplitudes: readonly number[],
  targetCount: number,
): number[] {
  if (amplitudes.length === 0) return [];
  if (amplitudes.length <= targetCount) return [...amplitudes];

  const bucketSize = amplitudes.length / targetCount;
  const result: number[] = [];

  for (let i = 0; i < targetCount; i++) {
    const start = Math.floor(i * bucketSize);
    const end = Math.floor((i + 1) * bucketSize);
    let sum = 0;
    let peak = 0;
    for (let j = start; j < end; j++) {
      sum += amplitudes[j];
      if (amplitudes[j] > peak) peak = amplitudes[j];
    }
    const avg = sum / (end - start);
    result.push(avg * 0.6 + peak * 0.4);
  }

  return result;
}
