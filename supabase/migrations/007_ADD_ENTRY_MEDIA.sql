CREATE TABLE IF NOT EXISTS public.entry_media (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id uuid NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    storage_path text NOT NULL,
    file_name text NOT NULL,
    content_type text NOT NULL,
    size_bytes bigint NOT NULL,
    width integer,
    height integer,
    sort_order integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT entry_media_size_positive CHECK (size_bytes > 0),
    CONSTRAINT entry_media_dimensions_positive CHECK (
        (width IS NULL AND height IS NULL) OR (width > 0 AND height > 0)
    ),
    CONSTRAINT entry_media_content_type_valid CHECK (
        content_type IN ('image/jpeg', 'image/png', 'image/heic', 'image/webp')
    )
);

ALTER TABLE public.entry_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own media"
    ON public.entry_media
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access on entry_media"
    ON public.entry_media
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE INDEX idx_entry_media_entry_id ON public.entry_media (entry_id, sort_order);
CREATE INDEX idx_entry_media_user_id ON public.entry_media (user_id);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'entry-media',
    'entry-media',
    false,
    10485760,
    ARRAY['image/jpeg', 'image/png', 'image/heic', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload own media"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'entry-media'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can read own media"
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'entry-media'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can delete own media"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'entry-media'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Service role full access on entry-media storage"
    ON storage.objects
    FOR ALL
    TO service_role
    USING (bucket_id = 'entry-media')
    WITH CHECK (bucket_id = 'entry-media');
