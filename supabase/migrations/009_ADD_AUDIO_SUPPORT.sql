ALTER TABLE public.entry_media
    ADD COLUMN duration_ms integer,
    ADD CONSTRAINT entry_media_duration_positive CHECK (duration_ms IS NULL OR duration_ms > 0);

ALTER TABLE public.entry_media
    DROP CONSTRAINT entry_media_content_type_valid;

ALTER TABLE public.entry_media
    ADD CONSTRAINT entry_media_content_type_valid CHECK (
        content_type IN (
            'image/jpeg', 'image/png', 'image/heic', 'image/webp',
            'audio/m4a', 'audio/mp4', 'audio/aac', 'audio/wav', 'audio/mpeg', 'audio/x-m4a'
        )
    );

UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
    'image/jpeg', 'image/png', 'image/heic', 'image/webp',
    'audio/m4a', 'audio/mp4', 'audio/aac', 'audio/wav', 'audio/mpeg', 'audio/x-m4a'
],
    file_size_limit = 26214400
WHERE id = 'entry-media';
