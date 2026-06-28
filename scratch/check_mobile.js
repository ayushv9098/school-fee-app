const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  // Try to query the mobile column first
  const { error: queryError } = await supabase.from('teachers').select('mobile').limit(1);
  
  if (queryError && queryError.message.includes('Could not find the \'mobile\' column')) {
    console.log('mobile column does not exist. Adding it...');
    // We can execute SQL via rpc if we have a function, but we don't.
    // Instead of raw SQL, we can't do DDL via standard JS client without an RPC that executes SQL.
    // Actually, postgres REST API doesn't support ALTER TABLE.
    console.log('Cannot alter table via JS client directly without RPC. Need another way or use a backend query.');
  } else {
    console.log('mobile column exists or other error:', queryError);
  }
}

main();
