import { createClient } from '@supabase/supabase-js';

// Supabase project: Smartbin
const SUPABASE_URL = 'https://ahlqtpuosntsphzdyczl.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_wkHTOPFXyGDL8g-8j9oYcA_oG-owhhX';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/*
 * ─── REQUIRED SUPABASE TABLES ───────────────────────────────────────────────
 * Run the following SQL in your Supabase SQL Editor:
 *
 * create table users (
 *   uid text primary key,
 *   name text, email text, password text, phone text,
 *   state text, city text, pincode text,
 *   eco_coins int default 0, total_scans int default 0,
 *   total_eco_coins_earned int default 0, co2_saved float default 0,
 *   level int default 1, language text default 'en',
 *   created_at timestamptz default now()
 * );
 *
 * create table user_emails (
 *   email_key text primary key, uid text, email text
 * );
 *
 * create table scans (
 *   id uuid primary key default gen_random_uuid(),
 *   user_id text, category text, item_name text, description text,
 *   confidence int, recyclable bool, hazardous bool,
 *   disposal_tip text, eco_coins_earned int, image_url text,
 *   created_at timestamptz default now()
 * );
 *
 * create table transactions (
 *   id uuid primary key default gen_random_uuid(),
 *   user_id text, type text, amount int, reason text,
 *   created_at timestamptz default now()
 * );
 *
 * create table bins (
 *   id text primary key,
 *   name text, address text, latitude float, longitude float,
 *   fill_level int default 0, dry int default 0, wet int default 0, metal int default 0,
 *   updated_at timestamptz default now()
 * );
 * ────────────────────────────────────────────────────────────────────────────
 */
