-- People who clicked "unsubscribe" in a broadcast email. Server-only (service role).
create table if not exists public.email_optouts (
  email text primary key,
  created_at timestamptz not null default now()
);
alter table public.email_optouts enable row level security;
revoke all on public.email_optouts from anon, authenticated;
