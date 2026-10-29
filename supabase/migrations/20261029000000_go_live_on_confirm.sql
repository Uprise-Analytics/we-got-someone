-- Guarantee: a worker's profile goes live the moment their email is confirmed,
-- no matter which device or browser they confirmed on.
-- A profile only gets switched on once: the owner_alert row in email_log marks that it already went live,
-- so profiles switched off later are never turned back on.

create or replace function public.go_live_on_confirm() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.email_confirmed_at is not null and old.email_confirmed_at is null
     and not exists (select 1 from public.email_log where email = lower(new.email) and kind = 'owner_alert') then
    update public.workers set is_active = true where user_id = new.id and is_active = false;
  end if;
  return new;
end $$;

drop trigger if exists go_live_on_confirm on auth.users;
create trigger go_live_on_confirm after update of email_confirmed_at on auth.users
  for each row execute function public.go_live_on_confirm();

-- Covers the race where someone confirms before their profile row is saved.
create or replace function public.go_live_on_insert() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.is_active = false and exists (
       select 1 from auth.users u where u.id = new.user_id and u.email_confirmed_at is not null
         and not exists (select 1 from public.email_log l where l.email = lower(u.email) and l.kind = 'owner_alert')) then
    new.is_active := true;
  end if;
  return new;
end $$;

drop trigger if exists go_live_on_insert on public.workers;
create trigger go_live_on_insert before insert on public.workers
  for each row execute function public.go_live_on_insert();
