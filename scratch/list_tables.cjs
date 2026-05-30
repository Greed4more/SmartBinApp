const SUPABASE_URL = 'https://ahlqtpuosntsphzdyczl.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_wkHTOPFXyGDL8g-8j9oYcA_oG-owhhX';

async function listTables() {
  try {
    const response = await fetch(SUPABASE_URL + '/rest/v1/', {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    
    const data = await response.json();
    console.log('Tables exposed in database:');
    if (data && data.definitions) {
      Object.keys(data.definitions).forEach(table => {
        console.log(`- ${table}`);
      });
    } else {
      console.log('Could not retrieve table definitions:', data);
    }
  } catch (error) {
    console.error('Error fetching table list:', error.message);
  }
}

listTables();
