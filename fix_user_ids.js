require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
(async () => {
  const USER_ID = '54d3f57f-6385-4281-895c-4e0004cf7fbf'; // The user ID that owns the students

  // Update all vehicles to this user_id
  const { data: v, error: ve } = await supabase.from('vehicles').update({ user_id: USER_ID }).neq('user_id', USER_ID);
  
  // Update all students to this user_id
  const { data: s, error: se } = await supabase.from('students').update({ user_id: USER_ID }).neq('user_id', USER_ID);

  console.log('Fixed vehicles:', ve);
  console.log('Fixed students:', se);
})();
