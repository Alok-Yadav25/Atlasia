create table if not exists public.place_cache (
  cache_key text primary key,
  place_name text not null,
  payload jsonb not null,
  expires_at timestamptz not null,
  updated_at timestamptz not null default now()
);

create index if not exists place_cache_expires_at_idx
  on public.place_cache (expires_at);

alter table public.place_cache enable row level security;

-- The app accesses this table only from server-side Route Handlers with the
-- service-role key, which bypasses RLS. Do not expose that key in NEXT_PUBLIC_*.

-- Optional cleanup, run manually or from a scheduled database job:
-- delete from public.place_cache where expires_at < now();
