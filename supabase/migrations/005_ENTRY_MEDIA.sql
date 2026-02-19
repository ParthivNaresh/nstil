create table public.entry_media (
    id              uuid primary key default gen_random_uuid(),
    entry_id        uuid not null references public.journal_entries(id) on delete cascade,
    user_id         uuid not null references auth.users(id) on delete cascade,
    storage_path    text not null,
    file_name       text not null,
    content_type    text not null,
    size_bytes      bigint not null,
    width           integer,
    height          integer,
    duration_ms     integer,
    waveform        jsonb,
    sort_order      integer not null default 0,
    created_at      timestamptz not null default now(),

    constraint entry_media_size_positive
        check (size_bytes > 0),

    constraint entry_media_dimensions_positive
        check (
            (width is null and height is null)
            or (width > 0 and height > 0)
        ),

    constraint entry_media_duration_positive
        check (duration_ms is null or duration_ms > 0),

    constraint entry_media_content_type_valid
        check (content_type in (
            'image/jpeg', 'image/png', 'image/heic', 'image/webp',
            'audio/m4a', 'audio/mp4', 'audio/aac', 'audio/wav', 'audio/mpeg', 'audio/x-m4a'
        ))
);

create index idx_entry_media_entry_id
    on public.entry_media (entry_id, sort_order);

create index idx_entry_media_user_id
    on public.entry_media (user_id);

alter table public.entry_media enable row level security;

create policy "Users can manage own media"
    on public.entry_media
    for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Service role full access on entry_media"
    on public.entry_media
    for all
    to service_role
    using (true)
    with check (true);


insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'entry-media',
    'entry-media',
    false,
    26214400,
    array[
        'image/jpeg', 'image/png', 'image/heic', 'image/webp',
        'audio/m4a', 'audio/mp4', 'audio/aac', 'audio/wav', 'audio/mpeg', 'audio/x-m4a'
    ]
)
on conflict (id) do nothing;

create policy "Users can upload own media"
    on storage.objects
    for insert
    to authenticated
    with check (
        bucket_id = 'entry-media'
        and (storage.foldername(name))[1] = auth.uid()::text
    );

create policy "Users can read own media"
    on storage.objects
    for select
    to authenticated
    using (
        bucket_id = 'entry-media'
        and (storage.foldername(name))[1] = auth.uid()::text
    );

create policy "Users can delete own media"
    on storage.objects
    for delete
    to authenticated
    using (
        bucket_id = 'entry-media'
        and (storage.foldername(name))[1] = auth.uid()::text
    );

create policy "Service role full access on entry-media storage"
    on storage.objects
    for all
    to service_role
    using (bucket_id = 'entry-media')
    with check (bucket_id = 'entry-media');
