const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ahlqtpuosntsphzdyczl.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_wkHTOPFXyGDL8g-8j9oYcA_oG-owhhX';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkGPSData() {
  console.log('Querying dustbin_locations table...');
  const { data, error } = await supabase
    .from('dustbin_locations')
    .select('*');
    
  if (error) {
    console.error('Error fetching data:', error.message);
  } else {
    console.log('Current rows in database:');
    console.log(JSON.stringify(data, null, 2));
  }
}

checkGPSData();
