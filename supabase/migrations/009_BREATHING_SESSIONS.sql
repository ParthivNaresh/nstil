create table public.breathing_sessions (
    id                  uuid primary key default gen_random_uuid(),
    user_id             uuid not null references auth.users on delete cascade,
    pattern             text not null
                        constraint breathing_sessions_pattern_check
                        check (pattern in ('box', '478', 'calm')),
    duration_seconds    integer not null
                        constraint breathing_sessions_duration_range
                        check (duration_seconds > 0 and duration_seconds <= 600),
    cycles_completed    integer not null default 0
                        constraint breathing_sessions_cycles_non_negative
                        check (cycles_completed >= 0),
    cycles_target       integer not null
                        constraint breathing_sessions_target_positive
                        check (cycles_target > 0),
    mood_before         text
                        constraint breathing_sessions_mood_before_check
                        check (mood_before is null or mood_before in (
                            'happy', 'calm', 'sad', 'anxious', 'angry'
                        )),
    mood_after          text
                        constraint breathing_sessions_mood_after_check
                        check (mood_after is null or mood_after in (
                            'happy', 'calm', 'sad', 'anxious', 'angry'
                        )),
    completed           boolean not null default false,
    created_at          timestamptz not null default now(),

    constraint breathing_sessions_cycles_within_target
        check (cycles_completed <= cycles_target)
);

create index idx_breathing_sessions_user_created
    on public.breathing_sessions (user_id, created_at desc);

alter table public.breathing_sessions enable row level security;

create policy "Users can view their own breathing sessions"
    on public.breathing_sessions for select
    using (auth.uid() = user_id);

create policy "Users can insert their own breathing sessions"
    on public.breathing_sessions for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own breathing sessions"
    on public.breathing_sessions for update
    using (auth.uid() = user_id);

create policy "Service role full access on breathing_sessions"
    on public.breathing_sessions
    for all
    to service_role
    using (true)
    with check (true);
