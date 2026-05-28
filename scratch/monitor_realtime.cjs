const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ahlqtpuosntsphzdyczl.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_wkHTOPFXyGDL8g-8j9oYcA_oG-owhhX';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('Monitoring database tables for 15 seconds to catch live updates...');

// Listen to bins
const binsChannel = supabase
  .channel('monitor-bins')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'bins' },
    (payload) => {
      console.log('\n🚨 LIVE EVENT on "bins" table:');
      console.log(payload);
    }
  )
  .subscribe((status) => {
    console.log('Bins subscription status:', status);
  });

// Listen to dustbin_locations
const gpsChannel = supabase
  .channel('monitor-gps')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'dustbin_locations' },
    (payload) => {
      console.log('\n🚨 LIVE EVENT on "dustbin_locations" table:');
      console.log(payload);
    }
  )
  .subscribe((status) => {
    console.log('Dustbin_locations subscription status:', status);
  });

setTimeout(() => {
  console.log('\nMonitoring finished.');
  supabase.removeChannel(binsChannel);
  supabase.removeChannel(gpsChannel);
  process.exit(0);
}, 15000);
