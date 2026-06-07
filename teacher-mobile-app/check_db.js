const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  const adminId = '54d3f57f-6385-4281-895c-4e0004cf7fbf';

  console.log("Checking if Admin is also a Teacher...");
  const { data: teacher, error } = await supabase.from('teachers').select('*').eq('auth_user_id', adminId);
  console.log("Teacher Record for Admin ID:", teacher);
}

checkData();