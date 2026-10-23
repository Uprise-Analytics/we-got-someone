-- One row per visit, profile view, WhatsApp tap or search, for the owner dashboard (/admin).
-- Written and read only by the server (service role). Visitors are identified by a random id, never personal data.
create table if not exists public.analytics_events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  type text not null check (type in ('page_view', 'profile_view', 'whatsapp_tap', 'search')),
  visitor_id text,
  session_id text,
  path text,
  worker_id uuid references public.workers(id) on delete cascade,
  trade text,
  area text,
  results integer,
  referrer text,
  utm_source text,
  device text
);

create index if not exists analytics_events_created_at_idx on public.analytics_events (created_at desc);
create index if not exists analytics_events_worker_idx on public.analytics_events (worker_id, type, created_at desc);

alter table public.analytics_events enable row level security;
revoke all on public.analytics_events from anon, authenticated;
