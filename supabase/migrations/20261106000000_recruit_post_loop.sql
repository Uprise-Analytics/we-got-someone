-- Never-ending daily recruit post on the We Got Someone Facebook page.
-- pg_cron fires at 06:00 UTC (08:00 SAST) every day; post_daily_recruit() picks the next post in
-- recruit_posts (by sort order, wrapping round) and publishes it through the Graph API with pg_net.
-- The page token lives in private.app_secrets (name 'meta_page_token'), inserted separately, never in git.
-- Post list is managed by GotSomeone\Facebook Posts\Recruit Loop\recruit_loop.py sync.

create extension if not exists pg_net;
create extension if not exists pg_cron;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create table if not exists private.app_secrets (name text primary key, value text not null);

create table if not exists public.recruit_posts (
  sort int primary key,
  image_url text not null,
  caption text not null
);
alter table public.recruit_posts enable row level security;

create table if not exists public.recruit_post_log (
  id bigserial primary key,
  posted_on date not null unique,
  sort int not null,
  request_id bigint,
  fb_response text,
  created_at timestamptz not null default now()
);
alter table public.recruit_post_log enable row level security;

create or replace function public.post_daily_recruit()
returns void
language plpgsql
security definer
set search_path = public, private, extensions
as $$
declare
  today date := (now() at time zone 'Africa/Johannesburg')::date;
  start_day constant date := date '2026-11-09';
  n int;
  p public.recruit_posts;
  token text;
  req bigint;
begin
  if today < start_day then return; end if;
  if exists (select 1 from public.recruit_post_log where posted_on = today) then return; end if;
  select count(*) into n from public.recruit_posts;
  if n = 0 then return; end if;
  select * into p from public.recruit_posts order by sort offset ((today - start_day) % n) limit 1;
  select value into token from private.app_secrets where name = 'meta_page_token';
  if token is null then raise exception 'meta_page_token missing'; end if;

  select net.http_post(
    url := 'https://graph.facebook.com/v26.0/355721867621900/photos',
    body := jsonb_build_object('url', p.image_url, 'caption', p.caption, 'access_token', token),
    headers := '{"Content-Type": "application/json"}'::jsonb,
    timeout_milliseconds := 30000
  ) into req;
  insert into public.recruit_post_log (posted_on, sort, request_id) values (today, p.sort, req);
end;
$$;

-- pg_net only keeps responses for a few hours, so copy Facebook's answer into the log
create or replace function public.recruit_log_responses()
returns void
language sql
security definer
set search_path = public, extensions
as $$
  update public.recruit_post_log l
     set fb_response = r.status_code || ' ' || coalesce(r.content::text, r.error_msg, '')
    from net._http_response r
   where r.id = l.request_id and l.fb_response is null;
$$;

revoke execute on function public.post_daily_recruit() from public, anon, authenticated;
revoke execute on function public.recruit_log_responses() from public, anon, authenticated;

select cron.schedule('recruit-post-daily', '0 6 * * *', 'select public.post_daily_recruit()');
select cron.schedule('recruit-post-log', '20 6 * * *', 'select public.recruit_log_responses()');
