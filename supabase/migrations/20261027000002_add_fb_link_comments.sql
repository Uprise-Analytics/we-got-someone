-- Website link to add as the first comment once each scheduled Facebook post goes live.
create table if not exists public.fb_link_comments (
  post_id text primary key,
  link text not null,
  commented_at timestamptz,
  comment_id text,
  created_at timestamptz not null default now()
);
alter table public.fb_link_comments enable row level security;
revoke all on public.fb_link_comments from anon, authenticated;
