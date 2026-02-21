create table public.journal_entries (
    id              uuid primary key default gen_random_uuid(),
    user_id         uuid not null references auth.users on delete cascade,
    journal_id      uuid not null references public.journals(id),
    title           text not null default '',
    body            text not null default '',
    mood_category   text,
    mood_specific   text,
    tags            text[] not null default '{}',
    location        text,
    latitude        double precision,
    longitude       double precision,
    entry_type      text not null default 'journal',
    is_pinned       boolean not null default false,
    embedding       vector(1536),
    embedding_model text,
    search_vector   tsvector,
    metadata        jsonb not null default '{}',
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now(),
    deleted_at      timestamptz,

    constraint journal_entries_entry_type_check
        check (entry_type in ('journal', 'reflection', 'gratitude', 'freewrite', 'check_in')),

    constraint journal_entries_mood_category_valid
        check (mood_category in ('happy', 'calm', 'sad', 'anxious', 'angry')),

    constraint journal_entries_mood_specific_valid
        check (mood_specific in (
            'joyful', 'grateful', 'excited', 'proud',
            'peaceful', 'content', 'relaxed', 'hopeful',
            'down', 'lonely', 'disappointed', 'nostalgic',
            'stressed', 'worried', 'overwhelmed', 'restless',
            'frustrated', 'irritated', 'hurt', 'resentful'
        )),

    constraint journal_entries_mood_specific_requires_category
        check (mood_specific is null or mood_category is not null),

    constraint chk_location_coords_pair
        check (
            (latitude is null and longitude is null)
            or (latitude is not null and longitude is not null)
        ),

    constraint chk_latitude_range
        check (latitude between -90 and 90),

    constraint chk_longitude_range
        check (longitude between -180 and 180)
);

create trigger handle_journal_entries_updated_at
    before update on public.journal_entries
    for each row
    execute function extensions.moddatetime(updated_at);


create or replace function public.journal_entries_search_vector_update()
returns trigger
language plpgsql
as $$
begin
    new.search_vector :=
        setweight(to_tsvector('english', coalesce(new.title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(new.body, '')), 'B');
    return new;
end;
$$;

create trigger trg_journal_entries_search_vector
    before insert or update of title, body
    on public.journal_entries
    for each row
    execute function public.journal_entries_search_vector_update();


create index idx_journal_entries_user_created
    on public.journal_entries (user_id, created_at desc)
    where deleted_at is null;

create index idx_journal_entries_user_pinned_created
    on public.journal_entries (user_id, is_pinned desc, created_at desc)
    where deleted_at is null;

create index idx_journal_entries_journal
    on public.journal_entries (journal_id, created_at desc)
    where deleted_at is null;

create index idx_journal_entries_tags
    on public.journal_entries using gin (tags)
    where deleted_at is null;

create index idx_journal_entries_search
    on public.journal_entries using gin (search_vector)
    where deleted_at is null;

create index idx_journal_entries_mood
    on public.journal_entries (user_id, mood_category)
    where deleted_at is null and mood_category is not null;

create index idx_journal_entries_location
    on public.journal_entries (user_id)
    where latitude is not null and deleted_at is null;

create index idx_journal_entries_embedding_hnsw
    on public.journal_entries
    using hnsw (embedding vector_cosine_ops)
    with (m = 16, ef_construction = 64);

create index idx_journal_entries_embedding_model
    on public.journal_entries (user_id, embedding_model)
    where embedding is not null and deleted_at is null;


alter table public.journal_entries enable row level security;

create policy "Users can view their own entries"
    on public.journal_entries for select
    using (auth.uid() = user_id);

create policy "Users can insert their own entries"
    on public.journal_entries for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own entries"
    on public.journal_entries for update
    using (auth.uid() = user_id);

create policy "Users can delete their own entries"
    on public.journal_entries for delete
    using (auth.uid() = user_id);

create policy "Service role full access on journal_entries"
    on public.journal_entries
    for all
    to service_role
    using (true)
    with check (true);


create or replace function public.search_journal_entries(
    p_user_id uuid,
    p_query text,
    p_limit int default 20,
    p_cursor timestamptz default null,
    p_journal_id uuid default null
)
returns setof public.journal_entries
language sql
stable
security definer
set search_path = ''
as $$
    select e.*
    from public.journal_entries e
    where e.user_id = p_user_id
      and e.deleted_at is null
      and e.search_vector @@ plainto_tsquery('english', p_query)
      and (p_cursor is null or e.created_at < p_cursor)
      and (p_journal_id is null or e.journal_id = p_journal_id)
    order by e.created_at desc
    limit p_limit;
$$;


create or replace function public.get_calendar_data(
    p_user_id uuid,
    p_year int,
    p_month int,
    p_timezone text default 'UTC'
)
returns table (
    date text,
    mood_category text,
    mood_specific text,
    entry_count bigint
)
language sql
stable
security definer
set search_path = ''
as $$
    with all_entries as (
        select
            to_char(e.created_at at time zone p_timezone, 'YYYY-MM-DD') as day
        from public.journal_entries e
        where e.user_id = p_user_id
          and e.deleted_at is null
          and extract(year from e.created_at at time zone p_timezone) = p_year
          and extract(month from e.created_at at time zone p_timezone) = p_month
    ),
    daily_counts as (
        select day, count(*) as cnt
        from all_entries
        group by day
    ),
    mood_entries as (
        select
            to_char(e.created_at at time zone p_timezone, 'YYYY-MM-DD') as day,
            e.mood_category,
            e.mood_specific,
            row_number() over (
                partition by to_char(e.created_at at time zone p_timezone, 'YYYY-MM-DD')
                order by e.created_at desc
            ) as rn
        from public.journal_entries e
        where e.user_id = p_user_id
          and e.deleted_at is null
          and e.mood_category is not null
          and extract(year from e.created_at at time zone p_timezone) = p_year
          and extract(month from e.created_at at time zone p_timezone) = p_month
    ),
    daily_mood as (
        select day, mood_category, mood_specific
        from mood_entries
        where rn = 1
    )
    select
        dc.day as date,
        dm.mood_category,
        dm.mood_specific,
        dc.cnt as entry_count
    from daily_counts dc
    left join daily_mood dm on dc.day = dm.day
    order by dc.day;
$$;


create or replace function public.get_daily_mood_distribution(
    p_user_id uuid,
    p_days int default 7,
    p_timezone text default 'UTC'
)
returns table (
    date text,
    mood_category text,
    entry_count bigint
)
language sql
stable
security definer
set search_path = ''
as $$
    select
        to_char(e.created_at at time zone p_timezone, 'YYYY-MM-DD') as date,
        e.mood_category,
        count(*) as entry_count
    from public.journal_entries e
    where e.user_id = p_user_id
      and e.deleted_at is null
      and e.mood_category is not null
      and e.created_at >= (now() at time zone p_timezone - make_interval(days => p_days))::date::timestamptz
    group by 1, e.mood_category
    order by 1
$$;
