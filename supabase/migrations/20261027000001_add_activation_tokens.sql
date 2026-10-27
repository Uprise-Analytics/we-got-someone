-- Long-lived, single-use activation links for people who never confirmed their email.
-- /auth/activate?t=<token> confirms the email, signs them in and puts their profile live.
create table if not exists public.activation_tokens (
  token text primary key default encode(gen_random_bytes(24), 'hex'),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  used_at timestamptz
);
alter table public.activation_tokens enable row level security;
revoke all on public.activation_tokens from anon, authenticated;
