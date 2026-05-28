const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ahlqtpuosntsphzdyczl.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_wkHTOPFXyGDL8g-8j9oYcA_oG-owhhX';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkBinsData() {
  console.log('Querying bins table...');
  const { data, error } = await supabase
    .from('bins')
    .select('*');
    
  if (error) {
    console.error('Error fetching bins:', error.message);
  } else {
    console.log('Current rows in bins database:');
    console.log(JSON.stringify(data, null, 2));
  }
}

checkBinsData();
