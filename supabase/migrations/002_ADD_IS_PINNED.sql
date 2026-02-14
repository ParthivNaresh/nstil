alter table public.journal_entries
    add column is_pinned boolean not null default false;

create index idx_journal_entries_user_pinned_created
    on public.journal_entries (user_id, is_pinned desc, created_at desc)
    where deleted_at is null;
