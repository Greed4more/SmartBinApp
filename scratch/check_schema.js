import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://ahlqtpuosntsphzdyczl.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_wkHTOPFXyGDL8g-8j9oYcA_oG-owhhX'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function checkSchema() {
  const { data, error } = await supabase.from('users').select('*').limit(1)
  if (error) {
    console.error('Error fetching users:', error)
  } else {
    console.log('Columns found:', Object.keys(data[0] || {}))
  }
}

checkSchema()
