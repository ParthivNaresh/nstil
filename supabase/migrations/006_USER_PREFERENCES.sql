create table public.user_ai_profiles (
    user_id             uuid primary key references auth.users on delete cascade,
    ai_enabled          boolean not null default true,
    prompt_style        text not null default 'gentle'
                        constraint user_ai_profiles_prompt_style_check
                        check (prompt_style in ('gentle', 'direct', 'analytical', 'motivational')),
    topics_to_avoid     text[] not null default '{}',
    goals               jsonb not null default '[]',
    last_check_in_at    timestamptz,
    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now()
);

create trigger handle_user_ai_profiles_updated_at
    before update on public.user_ai_profiles
    for each row
    execute function extensions.moddatetime(updated_at);

alter table public.user_ai_profiles enable row level security;

create policy "Users can view their own AI profile"
    on public.user_ai_profiles for select
    using (auth.uid() = user_id);

create policy "Users can insert their own AI profile"
    on public.user_ai_profiles for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own AI profile"
    on public.user_ai_profiles for update
    using (auth.uid() = user_id);

create policy "Service role full access on user_ai_profiles"
    on public.user_ai_profiles
    for all
    to service_role
    using (true)
    with check (true);


create table public.user_notification_preferences (
    user_id             uuid primary key references auth.users on delete cascade,
    reminders_enabled   boolean not null default false,
    frequency           text not null default 'daily'
                        constraint notification_prefs_frequency_check
                        check (frequency in ('daily', 'twice_daily', 'weekdays', 'custom')),
    reminder_times      jsonb not null default '[{"hour": 20, "minute": 0}]',
    active_days         integer[] not null default '{0,1,2,3,4,5,6}',
    quiet_hours_start   time,
    quiet_hours_end     time,
    last_notified_at    timestamptz,
    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now(),

    constraint notification_prefs_active_days_valid
        check (array_length(active_days, 1) is null or (
            active_days <@ '{0,1,2,3,4,5,6}'::integer[]
        )),

    constraint notification_prefs_quiet_hours_pair
        check (
            (quiet_hours_start is null and quiet_hours_end is null)
            or (quiet_hours_start is not null and quiet_hours_end is not null)
        )
);

create trigger handle_user_notification_preferences_updated_at
    before update on public.user_notification_preferences
    for each row
    execute function extensions.moddatetime(updated_at);

alter table public.user_notification_preferences enable row level security;

create policy "Users can view their own notification preferences"
    on public.user_notification_preferences for select
    using (auth.uid() = user_id);

create policy "Users can insert their own notification preferences"
    on public.user_notification_preferences for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own notification preferences"
    on public.user_notification_preferences for update
    using (auth.uid() = user_id);

create policy "Service role full access on user_notification_preferences"
    on public.user_notification_preferences
    for all
    to service_role
    using (true)
    with check (true);
