require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
(async () => {
  const ORIGINAL_STUDENT_OWNER = '54d3f57f-6385-4281-895c-4e0004cf7fbf'; 
  const ORIGINAL_VEHICLE_OWNER = '6c1ce8a4-2369-4467-b749-0f96d1496742';

  // Move students back to original owner
  const { error: se } = await supabase.from('students').update({ user_id: ORIGINAL_STUDENT_OWNER }).neq('user_id', ORIGINAL_STUDENT_OWNER);
  
  // Move vehicles back to original owner
  const { error: ve } = await supabase.from('vehicles').update({ user_id: ORIGINAL_VEHICLE_OWNER }).neq('user_id', ORIGINAL_VEHICLE_OWNER);

  console.log('Restored students:', se);
  console.log('Restored vehicles:', ve);
})();
