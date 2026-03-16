create table public.profiles (
    id                      uuid primary key references auth.users on delete cascade,
    display_name            text,
    avatar_url              text,
    onboarding_completed_at timestamptz,
    theme_mode              text not null default 'dark'
                            constraint profiles_theme_mode_check
                            check (theme_mode in ('dark','light','oled','auto','custom','sunset','forest','ocean','rose')),
    custom_themes           jsonb not null default '[]',
    active_custom_theme_id  text,
    created_at              timestamptz not null default now(),
    updated_at              timestamptz not null default now()
);

create trigger handle_profiles_updated_at
    before update on public.profiles
    for each row
    execute function extensions.moddatetime(updated_at);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
    on public.profiles for select
    using (auth.uid() = id);

create policy "Users can insert their own profile"
    on public.profiles for insert
    with check (auth.uid() = id);

create policy "Users can update their own profile"
    on public.profiles for update
    using (auth.uid() = id);

create policy "Service role full access on profiles"
    on public.profiles
    for all
    to service_role
    using (true)
    with check (true);
