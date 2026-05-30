-- DDL to create dustbin_locations table
create table if not exists public.dustbin_locations (
  id int8 primary key,
  latitude float8,
  longitude float8,
  updated_at timestamp with time zone default now()
);

-- Seed initial row
insert into public.dustbin_locations (id, latitude, longitude)
values (1, 28.6139, 77.2090)
on conflict (id) do nothing;

-- Enable Row Level Security (RLS)
alter table public.dustbin_locations enable row level security;

-- Policy: Allow anyone (public/anon) to read coordinates
drop policy if exists "Allow public select on dustbin_locations" on public.dustbin_locations;
create policy "Allow public select on dustbin_locations"
on public.dustbin_locations for select
using (true);

-- Policy: Allow anyone (public/anon/ESP32 REST) to update coordinates for testing
drop policy if exists "Allow public update on dustbin_locations" on public.dustbin_locations;
create policy "Allow public update on dustbin_locations"
on public.dustbin_locations for update
using (true)
with check (true);

-- Enable Realtime Replication for this table
alter publication supabase_realtime add table public.dustbin_locations;
