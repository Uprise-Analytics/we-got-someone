-- Daily 20:00 SAST post of the "Good at what you do?" ad, with the caption rotating so it isn't
-- the identical post every night. Reuses private.app_secrets ('meta_page_token') and pg_net from
-- 20261106000000_recruit_post_loop.sql.

create table if not exists public.comment_ad_posts (
  sort int primary key,
  image_url text not null,
  caption text not null
);
alter table public.comment_ad_posts enable row level security;

-- one log for both daily jobs
alter table public.recruit_post_log add column if not exists kind text not null default 'recruit';
alter table public.recruit_post_log drop constraint if exists recruit_post_log_posted_on_key;
create unique index if not exists recruit_post_log_day_kind on public.recruit_post_log (posted_on, kind);

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
  if exists (select 1 from public.recruit_post_log where posted_on = today and kind = 'recruit') then return; end if;
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
  insert into public.recruit_post_log (posted_on, sort, request_id, kind) values (today, p.sort, req, 'recruit');
end;
$$;

create or replace function public.post_daily_comment_ad()
returns void
language plpgsql
security definer
set search_path = public, private, extensions
as $$
declare
  today date := (now() at time zone 'Africa/Johannesburg')::date;
  start_day constant date := date '2026-11-06';
  n int;
  p public.comment_ad_posts;
  token text;
  req bigint;
begin
  if exists (select 1 from public.recruit_post_log where posted_on = today and kind = 'comment_ad') then return; end if;
  select count(*) into n from public.comment_ad_posts;
  if n = 0 then return; end if;
  select * into p from public.comment_ad_posts order by sort offset ((today - start_day) % n) limit 1;
  select value into token from private.app_secrets where name = 'meta_page_token';
  if token is null then raise exception 'meta_page_token missing'; end if;
  select net.http_post(
    url := 'https://graph.facebook.com/v26.0/355721867621900/photos',
    body := jsonb_build_object('url', p.image_url, 'caption', p.caption, 'access_token', token),
    headers := '{"Content-Type": "application/json"}'::jsonb,
    timeout_milliseconds := 30000
  ) into req;
  insert into public.recruit_post_log (posted_on, sort, request_id, kind) values (today, p.sort, req, 'comment_ad');
end;
$$;

revoke execute on function public.post_daily_comment_ad() from public, anon, authenticated;
revoke execute on function public.post_daily_recruit() from public, anon, authenticated;

select cron.schedule('comment-ad-daily', '0 18 * * *', 'select public.post_daily_comment_ad()');
select cron.schedule('comment-ad-log', '20 18 * * *', 'select public.recruit_log_responses()');
