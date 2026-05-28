const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ahlqtpuosntsphzdyczl.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_wkHTOPFXyGDL8g-8j9oYcA_oG-owhhX';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('Subscribing to realtime channel for dustbin_locations...');

let receivedRealtimeEvent = false;

const channel = supabase
  .channel('test-channel')
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'dustbin_locations',
      filter: 'id=eq.1'
    },
    (payload) => {
      console.log('\n🎉 SUCCESS: Received realtime update event!');
      console.log('Payload:', payload.new);
      receivedRealtimeEvent = true;
      
      // Clean up and exit
      supabase.removeChannel(channel);
      process.exit(0);
    }
  )
  .subscribe(async (status) => {
    console.log('Subscription status:', status);
    
    if (status === 'SUBSCRIBED') {
      console.log('Successfully subscribed! Now triggering a test database update...');
      
      // Trigger a dummy update to see if the realtime channel fires
      const newLat = 28.6139 + (Math.random() - 0.5) * 0.0001;
      const newLng = 77.2090 + (Math.random() - 0.5) * 0.0001;
      
      console.log(`Sending update request: Lat=${newLat.toFixed(6)}, Lng=${newLng.toFixed(6)}`);
      
      const { error } = await supabase
        .from('dustbin_locations')
        .update({
          latitude: newLat,
          longitude: newLng,
          updated_at: new Date().toISOString()
        })
        .eq('id', 1);
        
      if (error) {
        console.error('Update query failed:', error.message);
        process.exit(1);
      } else {
        console.log('Update query finished. Waiting 5 seconds for realtime event...');
        setTimeout(() => {
          if (!receivedRealtimeEvent) {
            console.error('\n❌ FAILURE: Realtime update event was NOT received.');
            console.error('This means the "dustbin_locations" table is NOT enabled for Realtime Replication in Supabase.');
            console.error('To fix this, please run this query in your Supabase SQL Editor:');
            console.error('ALTER PUBLICATION supabase_realtime ADD TABLE public.dustbin_locations;\n');
            process.exit(1);
          }
        }, 5000);
      }
    }
  });
