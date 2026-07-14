require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
(async () => {
  const ACTIVE_USER = 'b2869944-8e8f-4e0d-b4ec-7891fd355d69'; 

  // Move everything to ACTIVE_USER
  const { data: v, error: ve } = await supabase.from('vehicles').update({ user_id: ACTIVE_USER }).neq('user_id', ACTIVE_USER);
  const { data: s, error: se } = await supabase.from('students').update({ user_id: ACTIVE_USER }).neq('user_id', ACTIVE_USER);

  console.log('Fixed vehicles:', ve);
  console.log('Fixed students:', se);
})();
