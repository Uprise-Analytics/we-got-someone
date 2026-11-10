-- Allow 'call_tap' analytics events (customer tapped Call on a worker profile).
alter table public.analytics_events drop constraint if exists analytics_events_type_check;
alter table public.analytics_events add constraint analytics_events_type_check
  check (type in ('page_view', 'profile_view', 'whatsapp_tap', 'call_tap', 'search'));
