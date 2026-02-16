import { VoicePlayer } from "./VoicePlayer";
import { VoiceRecorderActive, VoiceRecorderInline } from "./VoiceRecorder";
import type { VoiceMemoProps } from "./types";

interface VoiceMemoInlineProps extends VoiceMemoProps {
  readonly isRecording: boolean;
  readonly onStartRecording: () => void;
}

export function VoiceMemoInline({
  localAudio,
  existingAudio,
  isRecording,
  onStartRecording,
}: VoiceMemoInlineProps) {
  if (localAudio || existingAudio || isRecording) {
    return null;
  }

  return <VoiceRecorderInline onPress={onStartRecording} />;
}

interface VoiceMemoSectionProps extends VoiceMemoProps {
  readonly isRecording: boolean;
  readonly onStopRecording: () => void;
}

export function VoiceMemoSection({
  localAudio,
  existingAudio,
  onRecord,
  onRemove,
  isRecording,
  onStopRecording,
}: VoiceMemoSectionProps) {
  if (isRecording) {
    return (
      <VoiceRecorderActive
        onRecordingComplete={(audio) => {
          onStopRecording();
          onRecord(audio);
        }}
        onCancel={onStopRecording}
      />
    );
  }

  if (localAudio) {
    return (
      <VoicePlayer
        uri={localAudio.uri}
        durationMs={localAudio.durationMs}
        waveform={localAudio.waveform}
        onRemove={onRemove}
      />
    );
  }

  if (existingAudio) {
    return (
      <VoicePlayer
        uri={existingAudio.url}
        durationMs={existingAudio.duration_ms ?? 0}
        waveform={existingAudio.waveform ?? undefined}
        onRemove={onRemove}
      />
    );
  }

  return null;
}
