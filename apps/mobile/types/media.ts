export type ImageContentType =
  | "image/jpeg"
  | "image/png"
  | "image/heic"
  | "image/webp";

export type AudioContentType =
  | "audio/m4a"
  | "audio/mp4"
  | "audio/aac"
  | "audio/wav"
  | "audio/mpeg"
  | "audio/x-m4a";

export type MediaContentType = ImageContentType | AudioContentType;

export interface EntryMedia {
  readonly id: string;
  readonly entry_id: string;
  readonly file_name: string;
  readonly content_type: MediaContentType;
  readonly size_bytes: number;
  readonly width: number | null;
  readonly height: number | null;
  readonly duration_ms: number | null;
  readonly waveform: readonly number[] | null;
  readonly sort_order: number;
  readonly url: string;
  readonly created_at: string;
}

export interface EntryMediaListResponse {
  readonly items: EntryMedia[];
  readonly count: number;
}

export interface MediaPreviewItem {
  readonly id: string;
  readonly url: string;
}

export interface MediaPreview {
  readonly items: MediaPreviewItem[];
  readonly total_count: number;
}

export interface LocalImage {
  readonly localId: string;
  readonly uri: string;
  readonly fileName: string;
  readonly contentType: string;
  readonly width: number;
  readonly height: number;
}

export interface LocalAudio {
  readonly uri: string;
  readonly fileName: string;
  readonly contentType: AudioContentType;
  readonly durationMs: number;
  readonly waveform: readonly number[];
}
