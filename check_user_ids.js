require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
(async () => {
  const { data: v } = await supabase.from('vehicles').select('id, name, user_id');
  const { data: s } = await supabase.from('students').select('user_id').limit(1);
  console.log('Vehicles:', v);
  console.log('Students user_id:', s[0]?.user_id);
})();
