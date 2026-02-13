-- Enable extensions
create extension if not exists "vector" with schema extensions;
create extension if not exists "moddatetime" with schema extensions;

-- ── Profiles ────────────────────────────────────────────

create table public.profiles (
    id          uuid primary key references auth.users on delete cascade,
    display_name text,
    avatar_url  text,
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
);

create trigger handle_profiles_updated_at
    before update on public.profiles
    for each row
    execute function extensions.moddatetime(updated_at);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
    on public.profiles for select
    using (auth.uid() = id);

create policy "Users can update their own profile"
    on public.profiles for update
    using (auth.uid() = id);

create policy "Users can insert their own profile"
    on public.profiles for insert
    with check (auth.uid() = id);

-- ── Journal Entries ─────────────────────────────────────

create table public.journal_entries (
    id          uuid primary key default gen_random_uuid(),
    user_id     uuid not null references auth.users on delete cascade,
    title       text not null default '',
    body        text not null default '',
    mood_score  smallint check (mood_score between 1 and 10),
    embedding   vector(1536),
    metadata    jsonb not null default '{}',
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
);

create trigger handle_journal_entries_updated_at
    before update on public.journal_entries
    for each row
    execute function extensions.moddatetime(updated_at);

create index idx_journal_entries_user_created
    on public.journal_entries (user_id, created_at desc);

create index idx_journal_entries_embedding
    on public.journal_entries
    using ivfflat (embedding vector_cosine_ops)
    with (lists = 100);

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

-- ── Auto-create profile on signup ───────────────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
    insert into public.profiles (id)
    values (new.id);
    return new;
end;
$$;

create trigger on_auth_user_created
    after insert on auth.users
    for each row
    execute function public.handle_new_user();
