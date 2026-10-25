-- People who clicked "unsubscribe" in a broadcast email. Server-only (service role).
create table if not exists public.email_optouts (
  email text primary key,
  created_at timestamptz not null default now()
);
alter table public.email_optouts enable row level security;
revoke all on public.email_optouts from anon, authenticated;

-- One random code per email address, used in unsubscribe links instead of a shared secret.
create table if not exists public.email_unsub_tokens (
  email text primary key,
  token text not null unique default encode(gen_random_bytes(18), 'hex'),
  created_at timestamptz not null default now()
);
alter table public.email_unsub_tokens enable row level security;
revoke all on public.email_unsub_tokens from anon, authenticated;
