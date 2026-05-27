import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://ahlqtpuosntsphzdyczl.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_wkHTOPFXyGDL8g-8j9oYcA_oG-owhhX'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
