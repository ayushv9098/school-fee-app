require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data, error } = await supabase.from('teacher_payments').select('*').limit(1);
  console.log("Data:", data);
  console.log("Error:", error);
  
  // also check if we can insert with academic_year
  const { data: insertData, error: insertError } = await supabase.from('teacher_payments').insert({
    teacher_id: '00000000-0000-0000-0000-000000000000', // invalid uuid might throw fk constraint, but if column doesn't exist it throws column error first
    user_id: '00000000-0000-0000-0000-000000000000',
    amount: 100,
    month: 1,
    year: 2024,
    academic_year: '2024-25'
  });
  console.log("Insert Error:", insertError);
}

check();
