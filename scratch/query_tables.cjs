const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ahlqtpuosntsphzdyczl.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_wkHTOPFXyGDL8g-8j9oYcA_oG-owhhX';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const tables = ['dustbin_locations', 'bins', 'gps', 'locations', 'tracking', 'coordinates', 'devices'];

async function checkAll() {
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*');
      if (error) {
        if (!error.message.includes('does not exist')) {
          console.log(`Table "${table}" error:`, error.message);
        }
      } else {
        console.log(`\n=== Table "${table}" has ${data.length} rows ===`);
        console.log(JSON.stringify(data, null, 2));
      }
    } catch (err) {
      // Ignore
    }
  }
}

checkAll();
