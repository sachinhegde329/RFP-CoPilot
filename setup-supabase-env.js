#!/usr/bin/env node

/**
 * Script to help set up Supabase environment variables
 * Run this script to get the environment variables you need to add to your .env file
 */

console.log('🚀 Supabase Environment Variables Setup\n');

console.log('📋 Required Environment Variables for Supabase:\n');

console.log('1. NEXT_PUBLIC_SUPABASE_URL');
console.log('   Description: Your Supabase project URL');
console.log('   Example: https://your-project-id.supabase.co');
console.log('   Get from: Supabase Dashboard → Project Settings → API → Project URL\n');

console.log('2. NEXT_PUBLIC_SUPABASE_ANON_KEY');
console.log('   Description: Your Supabase anonymous/public key (for client-side)');
console.log('   Example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
console.log('   Get from: Supabase Dashboard → Project Settings → API → anon public\n');

console.log('3. SUPABASE_SERVICE_ROLE_KEY');
console.log('   Description: Your Supabase service role key (for server-side)');
console.log('   Example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
console.log('   Get from: Supabase Dashboard → Project Settings → API → service_role\n');

console.log('\n📝 Add these to your .env file:\n');
console.log('NEXT_PUBLIC_SUPABASE_URL=your_project_url_here');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here');
console.log('SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here');

console.log('\n🔧 Next Steps:');
console.log('1. Go to https://app.supabase.com/');
console.log('2. Create a new project or select existing project');
console.log('3. Go to Project Settings → API');
console.log('4. Copy the Project URL and keys');
console.log('5. Add them to your .env file');
console.log('6. Run the SQL migration: supabase-migration.sql');
console.log('7. Restart your development server');

console.log('\n⚠️  Important Notes:');
console.log('- Keep your service_role key secret (never expose in client-side code)');
console.log('- The anon key is safe to use in client-side code');
console.log('- Make sure to enable the pgvector extension in your Supabase project');
console.log('- Run the migration SQL in your Supabase SQL editor'); 