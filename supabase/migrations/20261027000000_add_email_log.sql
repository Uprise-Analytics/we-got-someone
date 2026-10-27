-- One row per automated email sent to someone, so nobody gets the same email twice.
-- The row is written before sending (as a claim), so two triggers can't both send.
create table if not exists public.email_log (
  email text not null,
  kind text not null,
  sent_at timestamptz not null default now(),
  resend_id text,
  primary key (email, kind)
);
alter table public.email_log enable row level security;
revoke all on public.email_log from anon, authenticated;
