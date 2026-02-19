create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
    insert into public.profiles (id)
    values (new.id);

    insert into public.journals (user_id, name, sort_order)
    values (new.id, 'My Journal', 0);

    insert into public.user_ai_profiles (user_id)
    values (new.id);

    insert into public.user_notification_preferences (user_id)
    values (new.id);

    return new;
end;
$$;

create trigger on_auth_user_created
    after insert on auth.users
    for each row
    execute function public.handle_new_user();
