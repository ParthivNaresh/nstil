create table public.journals (
    id              uuid primary key default gen_random_uuid(),
    user_id         uuid not null references auth.users on delete cascade,
    name            text not null
                    constraint journals_name_length
                    check (char_length(name) <= 100),
    description     text
                    constraint journals_description_length
                    check (char_length(description) <= 500),
    color           text
                    constraint journals_color_hex
                    check (color ~ '^#[0-9a-fA-F]{6}$'),
    icon            text,
    sort_order      int not null default 0,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now(),
    deleted_at      timestamptz
);

create trigger handle_journals_updated_at
    before update on public.journals
    for each row
    execute function extensions.moddatetime(updated_at);

create index idx_journals_user_sort
    on public.journals (user_id, sort_order, created_at)
    where deleted_at is null;

alter table public.journals enable row level security;

create policy "Users can view their own journals"
    on public.journals for select
    using (auth.uid() = user_id);

create policy "Users can insert their own journals"
    on public.journals for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own journals"
    on public.journals for update
    using (auth.uid() = user_id);

create policy "Users can delete their own journals"
    on public.journals for delete
    using (auth.uid() = user_id);

create policy "Service role full access on journals"
    on public.journals
    for all
    to service_role
    using (true)
    with check (true);


create or replace function public.soft_delete_journal(
    p_user_id uuid,
    p_journal_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_now timestamptz := now();
    v_deleted boolean;
begin
    update public.journals
    set deleted_at = v_now
    where id = p_journal_id
      and user_id = p_user_id
      and deleted_at is null;

    v_deleted := found;

    if v_deleted then
        update public.journal_entries
        set deleted_at = v_now
        where journal_id = p_journal_id
          and user_id = p_user_id
          and deleted_at is null;
    end if;

    return v_deleted;
end;
$$;
