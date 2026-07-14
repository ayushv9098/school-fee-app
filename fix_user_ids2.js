require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
(async () => {
  const USER_ID = '6c1ce8a4-2369-4467-b749-0f96d1496742'; // The other user ID

  // Update all vehicles to this user_id
  const { data: v, error: ve } = await supabase.from('vehicles').update({ user_id: USER_ID }).neq('user_id', USER_ID);
  
  // Update all students to this user_id
  const { data: s, error: se } = await supabase.from('students').update({ user_id: USER_ID }).neq('user_id', USER_ID);

  console.log('Fixed vehicles:', ve);
  console.log('Fixed students:', se);
})();
