const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ahlqtpuosntsphzdyczl.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_wkHTOPFXyGDL8g-8j9oYcA_oG-owhhX';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Start from Delhi central
let lat = 28.6139;
let lng = 77.2090;
let angle = 0;

console.log('Starting GPS simulation stream...');
console.log('Sending updates to:', SUPABASE_URL);

const interval = setInterval(async () => {
  // Move in a circular path
  angle += 0.05;
  const currentLat = lat + Math.sin(angle) * 0.002;
  const currentLng = lng + Math.cos(angle) * 0.002;

  console.log(`[GPS Stream] Updating to Lat: ${currentLat.toFixed(6)}, Lng: ${currentLng.toFixed(6)}`);

  const { error } = await supabase
    .from('dustbin_locations')
    .update({
      latitude: currentLat,
      longitude: currentLng,
      updated_at: new Date().toISOString()
    })
    .eq('id', 1);

  if (error) {
    console.error('Update failed:', error.message);
    if (error.message.includes('relation "public.dustbin_locations" does not exist')) {
      console.warn('\n⚠️  Notice: The "dustbin_locations" table is missing in your Supabase DB.');
      console.warn('Please execute the SQL commands in "supabase/schema_gps.sql" inside your Supabase Dashboard SQL Editor first!\n');
      clearInterval(interval);
    }
  } else {
    console.log('Sync OK.');
  }
}, 3000);
