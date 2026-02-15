alter table public.journal_entries
    add column mood_category text,
    add column mood_specific text;

alter table public.journal_entries
    add constraint journal_entries_mood_category_valid
    check (mood_category in ('happy', 'calm', 'sad', 'anxious', 'angry'));

alter table public.journal_entries
    add constraint journal_entries_mood_specific_valid
    check (mood_specific in (
        'joyful', 'grateful', 'excited', 'proud',
        'peaceful', 'content', 'relaxed', 'hopeful',
        'down', 'lonely', 'disappointed', 'nostalgic',
        'stressed', 'worried', 'overwhelmed', 'restless',
        'frustrated', 'irritated', 'hurt', 'resentful'
    ));

alter table public.journal_entries
    add constraint journal_entries_mood_specific_requires_category
    check (mood_specific is null or mood_category is not null);

update public.journal_entries set mood_category = 'angry'   where mood_score = 1;
update public.journal_entries set mood_category = 'sad'     where mood_score = 2;
update public.journal_entries set mood_category = 'calm'    where mood_score = 3;
update public.journal_entries set mood_category = 'calm'    where mood_score = 4;
update public.journal_entries set mood_category = 'happy'   where mood_score = 5;

alter table public.journal_entries drop column mood_score;

create index idx_journal_entries_mood
    on public.journal_entries (user_id, mood_category)
    where deleted_at is null and mood_category is not null;
