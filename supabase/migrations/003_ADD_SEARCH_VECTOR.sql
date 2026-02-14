alter table public.journal_entries
    add column search_vector tsvector;

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

update public.journal_entries
set search_vector =
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(body, '')), 'B');

create index idx_journal_entries_search
    on public.journal_entries using gin (search_vector)
    where deleted_at is null;

create or replace function public.search_journal_entries(
    p_user_id uuid,
    p_query text,
    p_limit int default 20,
    p_cursor timestamptz default null
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
    order by e.created_at desc
    limit p_limit;
$$;
