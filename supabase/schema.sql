-- Users Profile table
create table if not exists users (
  uid text primary key,
  name text,
  email text,
  password text,
  phone text,
  state text,
  city text,
  pincode text,
  dob date,
  address text,
  eco_coins int default 0,
  total_scans int default 0,
  total_eco_coins_earned int default 0,
  co2_saved float default 0,
  level int default 1,
  language text default 'en',
  face_id_enabled boolean default false,
  face_descriptor float8[],
  photo_url text,
  created_at timestamptz default now()
);

-- Email lookups index
create table if not exists user_emails (
  email_key text primary key,
  uid text,
  email text
);

-- Waste Scans log
create table if not exists scans (
  id uuid primary key default gen_random_uuid(),
  user_id text references users(uid) on delete cascade,
  category text check (category in ('dry', 'wet', 'metal', 'plastic', 'ewaste', 'unknown')),
  item_name text,
  description text,
  confidence int,
  recyclable boolean,
  hazardous boolean,
  disposal_tip text,
  eco_coins_earned int,
  image_url text,
  created_at timestamptz default now()
);

-- Coins Transaction ledger
create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  user_id text references users(uid) on delete cascade,
  type text check (type in ('earn', 'redeem')),
  amount int,
  reason text,
  created_at timestamptz default now()
);

-- Real-time Bin hardware simulation status
create table if not exists bins (
  id text primary key,
  name text,
  address text,
  latitude float,
  longitude float,
  fill_level int default 0,
  dry int default 0,
  wet int default 0,
  metal int default 0,
  updated_at timestamptz default now()
);

-- Insert demo bin
insert into bins (id, name, address, latitude, longitude, fill_level, dry, wet, metal)
values ('main_bin', 'SmartBin Demo Hub', 'New Delhi Central District', 28.6139, 77.2090, 45, 45, 30, 20)
on conflict (id) do nothing;

-- Disable Row Level Security (RLS) to ensure direct frontend access for the demo
alter table users disable row level security;
alter table user_emails disable row level security;
alter table scans disable row level security;
alter table transactions disable row level security;
alter table bins disable row level security;

