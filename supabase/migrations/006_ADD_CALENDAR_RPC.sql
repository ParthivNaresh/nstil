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
