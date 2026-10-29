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
-- Not limited to the email_confirmed_at column: Supabase's auth server doesn't always list it in its updates.
create trigger go_live_on_confirm after update on auth.users
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

-- workers_protect_columns resets is_active unless the change comes from the service role.
-- The go-live triggers run inside the database as postgres (no JWT), so allow that role too.
-- Logged-in users run as "authenticated" and can never act as postgres, so their limits are unchanged.
create or replace function public.workers_protect_columns() returns trigger
language plpgsql as $$
BEGIN
  IF auth.role() = 'service_role' OR current_user = 'postgres' THEN
    RETURN new;
  END IF;
  new.free_until        := old.free_until;
  new.is_active         := old.is_active;
  new.guarantee_claimed := old.guarantee_claimed;
  new.referral_code     := old.referral_code;
  new.referred_by       := old.referred_by;
  new.profile_views     := old.profile_views;
  new.whatsapp_taps     := old.whatsapp_taps;
  new.user_id           := old.user_id;
  new.created_at        := old.created_at;
  RETURN new;
END;
$$;
