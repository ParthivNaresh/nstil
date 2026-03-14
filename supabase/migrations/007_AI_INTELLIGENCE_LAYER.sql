create table public.ai_sessions (
    id                  uuid primary key default gen_random_uuid(),
    user_id             uuid not null references auth.users on delete cascade,
    parent_session_id   uuid references public.ai_sessions(id) on delete set null,
    session_type        text not null
                        constraint ai_sessions_type_check
                        check (session_type in (
                            'check_in', 'guided_journal', 'reflection',
                            'insight', 'conversation', 'voice_to_journal',
                            'agent_task'
                        )),
    status              text not null default 'active'
                        constraint ai_sessions_status_check
                        check (status in ('active', 'paused', 'completed', 'abandoned', 'converted', 'failed')),
    entry_id            uuid references public.journal_entries(id) on delete set null,
    trigger_source      text
                        constraint ai_sessions_trigger_check
                        check (trigger_source is null or trigger_source in (
                            'notification', 'manual', 'app_open', 'post_entry',
                            'scheduled', 'widget', 'shortcut', 'agent'
                        )),
    model_id            text,
    flow_state          jsonb not null default '{}',
    token_count_total   integer not null default 0,
    metadata            jsonb not null default '{}',
    created_at          timestamptz not null default now(),
    completed_at        timestamptz,
    deleted_at          timestamptz
);

create index idx_ai_sessions_user_created
    on public.ai_sessions (user_id, created_at desc)
    where deleted_at is null;

create index idx_ai_sessions_user_status
    on public.ai_sessions (user_id, status)
    where deleted_at is null;

create index idx_ai_sessions_entry
    on public.ai_sessions (entry_id)
    where entry_id is not null;

create index idx_ai_sessions_parent
    on public.ai_sessions (parent_session_id)
    where parent_session_id is not null;

alter table public.ai_sessions enable row level security;

create policy "Users can view their own AI sessions"
    on public.ai_sessions for select
    using (auth.uid() = user_id);

create policy "Users can insert their own AI sessions"
    on public.ai_sessions for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own AI sessions"
    on public.ai_sessions for update
    using (auth.uid() = user_id);

create policy "Users can delete their own AI sessions"
    on public.ai_sessions for delete
    using (auth.uid() = user_id);

create policy "Service role full access on ai_sessions"
    on public.ai_sessions
    for all
    to service_role
    using (true)
    with check (true);


create table public.ai_messages (
    id              uuid primary key default gen_random_uuid(),
    session_id      uuid not null references public.ai_sessions(id) on delete cascade,
    user_id         uuid not null references auth.users on delete cascade,
    role            text not null
                    constraint ai_messages_role_check
                    check (role in ('system', 'assistant', 'user', 'tool')),
    content         text not null
                    constraint ai_messages_content_length
                    check (char_length(content) > 0 and char_length(content) <= 50000),
    sort_order      integer not null default 0,
    token_count     integer,
    latency_ms      integer,
    model_id        text,
    metadata        jsonb not null default '{}',
    created_at      timestamptz not null default now(),
    deleted_at      timestamptz
);

create index idx_ai_messages_session_order
    on public.ai_messages (session_id, sort_order)
    where deleted_at is null;

create index idx_ai_messages_user
    on public.ai_messages (user_id, created_at desc)
    where deleted_at is null;

alter table public.ai_messages enable row level security;

create policy "Users can view their own AI messages"
    on public.ai_messages for select
    using (auth.uid() = user_id);

create policy "Users can insert their own AI messages"
    on public.ai_messages for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own AI messages"
    on public.ai_messages for update
    using (auth.uid() = user_id);

create policy "Service role full access on ai_messages"
    on public.ai_messages
    for all
    to service_role
    using (true)
    with check (true);


create table public.ai_prompts (
    id                  uuid primary key default gen_random_uuid(),
    user_id             uuid not null references auth.users on delete cascade,
    prompt_type         text not null
                        constraint ai_prompts_type_check
                        check (prompt_type in (
                            'check_in', 'guided', 'reflection', 'nudge',
                            'summary', 'affirmation', 'reframe', 'follow_up',
                            'goal_check', 'notification'
                        )),
    content             text not null
                        constraint ai_prompts_content_length
                        check (char_length(content) > 0 and char_length(content) <= 10000),
    context             jsonb not null default '{}',
    source              text not null default 'curated'
                        constraint ai_prompts_source_check
                        check (source in ('curated', 'on_device_llm', 'cloud_llm')),
    mood_category       text,
    session_id          uuid references public.ai_sessions(id) on delete set null,
    entry_id            uuid references public.journal_entries(id) on delete set null,
    converted_entry_id  uuid references public.journal_entries(id) on delete set null,
    status              text not null default 'pending'
                        constraint ai_prompts_status_check
                        check (status in (
                            'pending', 'delivered', 'seen', 'engaged',
                            'dismissed', 'expired', 'converted'
                        )),
    delivered_at        timestamptz,
    seen_at             timestamptz,
    engaged_at          timestamptz,
    dismissed_at        timestamptz,
    converted_at        timestamptz,
    created_at          timestamptz not null default now(),
    deleted_at          timestamptz
);

create index idx_ai_prompts_user_status
    on public.ai_prompts (user_id, status, created_at desc)
    where deleted_at is null;

create index idx_ai_prompts_user_type
    on public.ai_prompts (user_id, prompt_type, created_at desc)
    where deleted_at is null;

create index idx_ai_prompts_session
    on public.ai_prompts (session_id)
    where session_id is not null;

create index idx_ai_prompts_converted_entry
    on public.ai_prompts (converted_entry_id)
    where converted_entry_id is not null;

alter table public.ai_prompts enable row level security;

create policy "Users can view their own AI prompts"
    on public.ai_prompts for select
    using (auth.uid() = user_id);

create policy "Users can insert their own AI prompts"
    on public.ai_prompts for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own AI prompts"
    on public.ai_prompts for update
    using (auth.uid() = user_id);

create policy "Service role full access on ai_prompts"
    on public.ai_prompts
    for all
    to service_role
    using (true)
    with check (true);


create table public.ai_insights (
    id                  uuid primary key default gen_random_uuid(),
    user_id             uuid not null references auth.users on delete cascade,
    insight_type        text not null
                        constraint ai_insights_type_check
                        check (insight_type in (
                            'pattern', 'trend', 'connection', 'goal_progress',
                            'weekly_summary', 'monthly_summary', 'yearly_summary',
                            'cognitive_pattern', 'streak_milestone', 'correlation',
                            'anomaly', 'recommendation'
                        )),
    title               text not null
                        constraint ai_insights_title_length
                        check (char_length(title) > 0 and char_length(title) <= 500),
    content             text not null
                        constraint ai_insights_content_length
                        check (char_length(content) > 0 and char_length(content) <= 50000),
    supporting_entry_ids uuid[] not null default '{}',
    source              text not null default 'computed'
                        constraint ai_insights_source_check
                        check (source in ('on_device_llm', 'cloud_llm', 'computed')),
    model_id            text,
    confidence          real
                        constraint ai_insights_confidence_range
                        check (confidence is null or (confidence >= 0.0 and confidence <= 1.0)),
    period_start        date,
    period_end          date,
    status              text not null default 'generated'
                        constraint ai_insights_status_check
                        check (status in (
                            'generated', 'delivered', 'seen', 'dismissed', 'bookmarked'
                        )),
    session_id          uuid references public.ai_sessions(id) on delete set null,
    superseded_by       uuid references public.ai_insights(id) on delete set null,
    metadata            jsonb not null default '{}',
    created_at          timestamptz not null default now(),
    expires_at          timestamptz,
    deleted_at          timestamptz,

    constraint ai_insights_period_order
        check (period_start is null or period_end is null or period_start <= period_end)
);

create index idx_ai_insights_user_type
    on public.ai_insights (user_id, insight_type, created_at desc)
    where deleted_at is null;

create index idx_ai_insights_user_status
    on public.ai_insights (user_id, status)
    where deleted_at is null;

create index idx_ai_insights_period
    on public.ai_insights (user_id, period_start, period_end)
    where deleted_at is null and period_start is not null;

create index idx_ai_insights_supporting_entries
    on public.ai_insights using gin (supporting_entry_ids)
    where deleted_at is null;

create index idx_ai_insights_superseded
    on public.ai_insights (superseded_by)
    where superseded_by is not null;

alter table public.ai_insights enable row level security;

create policy "Users can view their own AI insights"
    on public.ai_insights for select
    using (auth.uid() = user_id);

create policy "Users can insert their own AI insights"
    on public.ai_insights for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own AI insights"
    on public.ai_insights for update
    using (auth.uid() = user_id);

create policy "Service role full access on ai_insights"
    on public.ai_insights
    for all
    to service_role
    using (true)
    with check (true);


create table public.ai_feedback (
    id              uuid primary key default gen_random_uuid(),
    user_id         uuid not null references auth.users on delete cascade,
    target_type     text not null
                    constraint ai_feedback_target_type_check
                    check (target_type in ('message', 'prompt', 'insight', 'session')),
    target_id       uuid not null,
    rating          smallint not null
                    constraint ai_feedback_rating_range
                    check (rating between -1 and 1),
    reason          text
                    constraint ai_feedback_reason_length
                    check (reason is null or char_length(reason) <= 1000),
    metadata        jsonb not null default '{}',
    created_at      timestamptz not null default now()
);

create index idx_ai_feedback_user
    on public.ai_feedback (user_id, created_at desc);

create index idx_ai_feedback_target
    on public.ai_feedback (target_type, target_id);

alter table public.ai_feedback enable row level security;

create policy "Users can view their own AI feedback"
    on public.ai_feedback for select
    using (auth.uid() = user_id);

create policy "Users can insert their own AI feedback"
    on public.ai_feedback for insert
    with check (auth.uid() = user_id);

create policy "Service role full access on ai_feedback"
    on public.ai_feedback
    for all
    to service_role
    using (true)
    with check (true);


create table public.ai_agent_tasks (
    id              uuid primary key default gen_random_uuid(),
    user_id         uuid not null references auth.users on delete cascade,
    task_type       text not null
                    constraint ai_agent_tasks_type_check
                    check (task_type in (
                        'generate_embeddings', 'generate_insight',
                        'weekly_summary', 'monthly_summary', 'yearly_summary',
                        'pattern_detection', 'reembed_entries',
                        'goal_evaluation', 'anomaly_detection'
                    )),
    status          text not null default 'pending'
                    constraint ai_agent_tasks_status_check
                    check (status in ('pending', 'running', 'completed', 'failed', 'cancelled')),
    priority        smallint not null default 0
                    constraint ai_agent_tasks_priority_range
                    check (priority between 0 and 10),
    input           jsonb not null default '{}',
    output          jsonb,
    error           text,
    session_id      uuid references public.ai_sessions(id) on delete set null,
    attempts        smallint not null default 0,
    max_attempts    smallint not null default 3,
    scheduled_for   timestamptz not null default now(),
    started_at      timestamptz,
    completed_at    timestamptz,
    created_at      timestamptz not null default now(),

    constraint ai_agent_tasks_attempts_valid
        check (attempts <= max_attempts)
);

create index idx_ai_agent_tasks_pending
    on public.ai_agent_tasks (priority desc, scheduled_for)
    where status = 'pending';

create index idx_ai_agent_tasks_user
    on public.ai_agent_tasks (user_id, created_at desc);

create index idx_ai_agent_tasks_status
    on public.ai_agent_tasks (status, task_type);

alter table public.ai_agent_tasks enable row level security;

create policy "Service role full access on ai_agent_tasks"
    on public.ai_agent_tasks
    for all
    to service_role
    using (true)
    with check (true);


create table public.entry_embeddings (
    id              uuid primary key default gen_random_uuid(),
    entry_id        uuid not null references public.journal_entries(id) on delete cascade,
    user_id         uuid not null references auth.users on delete cascade,
    model_id        text not null,
    embedding       extensions.vector(1536) not null,
    dimensions      smallint not null default 1536,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now(),

    constraint entry_embeddings_unique_model
        unique (entry_id, model_id),

    constraint entry_embeddings_dimensions_valid
        check (dimensions > 0 and dimensions <= 4096)
);

create trigger handle_entry_embeddings_updated_at
    before update on public.entry_embeddings
    for each row
    execute function extensions.moddatetime(updated_at);

create index idx_entry_embeddings_user_model
    on public.entry_embeddings (user_id, model_id);

create index idx_entry_embeddings_hnsw
    on public.entry_embeddings
    using hnsw (embedding extensions.vector_cosine_ops)
    with (m = 16, ef_construction = 64);

alter table public.entry_embeddings enable row level security;

create policy "Users can view their own embeddings"
    on public.entry_embeddings for select
    using (auth.uid() = user_id);

create policy "Service role full access on entry_embeddings"
    on public.entry_embeddings
    for all
    to service_role
    using (true)
    with check (true);


create or replace function public.semantic_search(
    p_user_id uuid,
    p_embedding extensions.vector(1536),
    p_model_id text,
    p_match_count int default 10,
    p_similarity_threshold real default 0.5
)
returns table (
    entry_id uuid,
    similarity real,
    title text,
    body text,
    mood_category text,
    mood_specific text,
    tags text[],
    entry_type text,
    created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
    return query
    select
        je.id as entry_id,
        (1 - (ee.embedding operator(extensions.<=>) p_embedding))::real as similarity,
        je.title,
        je.body,
        je.mood_category,
        je.mood_specific,
        je.tags,
        je.entry_type,
        je.created_at
    from public.entry_embeddings ee
    join public.journal_entries je on je.id = ee.entry_id
    where ee.user_id = p_user_id
      and ee.model_id = p_model_id
      and je.deleted_at is null
      and (1 - (ee.embedding operator(extensions.<=>) p_embedding)) >= p_similarity_threshold
    order by ee.embedding operator(extensions.<=>) p_embedding
    limit p_match_count;
end;
$$;


create or replace function public.get_ai_context(
    p_user_id uuid,
    p_entry_limit int default 10,
    p_days_back int default 14
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
    with recent_entries as (
        select
            je.id, je.title, je.body, je.mood_category, je.mood_specific,
            je.tags, je.entry_type, je.location, je.created_at,
            j.name as journal_name
        from public.journal_entries je
        join public.journals j on j.id = je.journal_id
        where je.user_id = p_user_id
          and je.deleted_at is null
          and je.created_at >= now() - (p_days_back || ' days')::interval
        order by je.created_at desc
        limit p_entry_limit
    ),
    mood_distribution as (
        select
            mood_category,
            mood_specific,
            count(*) as count
        from public.journal_entries
        where user_id = p_user_id
          and deleted_at is null
          and mood_category is not null
          and created_at >= now() - (p_days_back || ' days')::interval
        group by mood_category, mood_specific
        order by count desc
    ),
    recent_prompts as (
        select
            prompt_type, content, status, source, created_at
        from public.ai_prompts
        where user_id = p_user_id
          and deleted_at is null
          and created_at >= now() - interval '7 days'
        order by created_at desc
        limit 10
    ),
    recent_sessions as (
        select
            id, session_type, status, trigger_source, created_at, completed_at
        from public.ai_sessions
        where user_id = p_user_id
          and deleted_at is null
          and created_at >= now() - interval '7 days'
        order by created_at desc
        limit 5
    ),
    entry_stats as (
        select
            count(*) as total_entries,
            count(*) filter (where created_at >= now() - interval '7 days') as entries_last_7d,
            count(*) filter (where entry_type = 'check_in') as check_ins_total,
            count(*) filter (
                where entry_type = 'check_in'
                and created_at >= now() - interval '7 days'
            ) as check_ins_last_7d,
            avg(char_length(body)) filter (
                where created_at >= now() - interval '7 days'
            ) as avg_entry_length_7d,
            max(created_at) as last_entry_at
        from public.journal_entries
        where user_id = p_user_id
          and deleted_at is null
          and created_at >= now() - (p_days_back || ' days')::interval
    ),
    user_profile as (
        select
            prompt_style, topics_to_avoid, goals
        from public.user_ai_profiles
        where user_id = p_user_id
    )
    select jsonb_build_object(
        'recent_entries', coalesce(
            (select jsonb_agg(jsonb_build_object(
                'id', re.id,
                'title', re.title,
                'body', left(re.body, 500),
                'mood_category', re.mood_category,
                'mood_specific', re.mood_specific,
                'tags', re.tags,
                'entry_type', re.entry_type,
                'location', re.location,
                'journal_name', re.journal_name,
                'created_at', re.created_at
            )) from recent_entries re),
            '[]'::jsonb
        ),
        'mood_distribution', coalesce(
            (select jsonb_agg(jsonb_build_object(
                'mood_category', md.mood_category,
                'mood_specific', md.mood_specific,
                'count', md.count
            )) from mood_distribution md),
            '[]'::jsonb
        ),
        'recent_prompts', coalesce(
            (select jsonb_agg(jsonb_build_object(
                'prompt_type', rp.prompt_type,
                'content', rp.content,
                'status', rp.status,
                'source', rp.source,
                'created_at', rp.created_at
            )) from recent_prompts rp),
            '[]'::jsonb
        ),
        'recent_sessions', coalesce(
            (select jsonb_agg(jsonb_build_object(
                'id', rs.id,
                'session_type', rs.session_type,
                'status', rs.status,
                'trigger_source', rs.trigger_source,
                'created_at', rs.created_at,
                'completed_at', rs.completed_at
            )) from recent_sessions rs),
            '[]'::jsonb
        ),
        'stats', (select jsonb_build_object(
            'total_entries', es.total_entries,
            'entries_last_7d', es.entries_last_7d,
            'check_ins_total', es.check_ins_total,
            'check_ins_last_7d', es.check_ins_last_7d,
            'avg_entry_length_7d', round(es.avg_entry_length_7d::numeric),
            'last_entry_at', es.last_entry_at
        ) from entry_stats es),
        'profile', (select jsonb_build_object(
            'prompt_style', up.prompt_style,
            'topics_to_avoid', up.topics_to_avoid,
            'goals', up.goals
        ) from user_profile up)
    );
$$;
