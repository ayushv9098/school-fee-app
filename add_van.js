require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
(async () => {
  const { data: magic } = await supabase.from('vehicles').select('user_id').eq('name', 'magic').single();
  if (magic) {
    const { data, error } = await supabase.from('vehicles').insert({ name: 'Van', type: 'Van', user_id: magic.user_id });
    console.log('Inserted:', data, error);
  }
})();
