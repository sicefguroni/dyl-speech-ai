import { createClient } from "@supabase/supabase-js";
import dotenv from 'dotenv';
import { join } from 'node:path';

// 1. Load Environment Variables
// Resolve path relative to script location (apps/next/scripts/ -> apps/next/.env.local)
const envPath = join(__dirname, '..', '.env.local');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 2. Sanity Check: Are keys present?
if (!supabaseUrl || !supabaseKey) {
  console.error('❌ FATAL: Missing Supabase URL or Key in .env.local')
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runSmokeTest() {
  console.log('🔍 Starting Infrastructure Verification...')

  // TEST CASE 1: Connection Check
  // We try to fetch from the 'notes' table. Even if empty, it should not error.
  const { error: connectionError } = await supabase.from('notes').select('count').limit(1);

  if (connectionError) {
    console.error('❌ TEST FAILED: Database Connection Failed.');
    console.error('   Details:', connectionError.message);
    return;
  }
  console.log('✅ TEST PASSED: Database Connection Successful.');

  // TEST CASE 2: Security Verification (RLS)
  // We attempt to insert a record WITHOUT being logged in.
  // Expected Result: The database should REJECT this request.
  console.log('🔒 Verifying Security Policies...');

  const { error: securityError } = await supabase.from('notes').insert({
    content_raw: 'Securty Test - Should Fail',
    user_id: '00000000-0000-0000-0000-000000000000',
  });

  if (securityError) {
    console.log('✅ TEST PASSED: Rejected Unauthenticated Access.');
    console.log('   (System Message: ${securityError.message})');
  } else {
    console.error('❌ CRITICAL VULNERABILITY: Allowed Unauthenticated Access.');
    console.error('   Action Required: Check RLS Policies immediately.');
  }
}

runSmokeTest()