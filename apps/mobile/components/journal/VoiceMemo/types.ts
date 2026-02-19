import type { EntryMedia, LocalAudio } from "@/types";

export interface VoiceMemoProps {
  readonly localAudio: LocalAudio | null;
  readonly existingAudio: EntryMedia | null;
  readonly onRecord: (audio: LocalAudio) => void;
  readonly onRemove: () => void;
}

export interface WaveformBarData {
  readonly amplitude: number;
}
