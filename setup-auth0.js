#!/usr/bin/env node

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

console.log('🔐 Auth0 Setup Helper for RFP CoPilot\n');

// Generate a secure random secret for Auth0
const generateSecret = () => {
  return crypto.randomBytes(32).toString('base64');
};

// Read current .env file
const envPath = path.join(process.cwd(), '.env');
let envContent = '';

try {
  envContent = fs.readFileSync(envPath, 'utf8');
} catch (error) {
  console.error('❌ Could not read .env file');
  process.exit(1);
}

// Generate new secret
const newSecret = generateSecret();

// Update .env file with the new secret
const updatedContent = envContent.replace(
  /AUTH0_SECRET=/,
  `AUTH0_SECRET=${newSecret}`
);

try {
  fs.writeFileSync(envPath, updatedContent);
  console.log('✅ Generated secure Auth0 secret');
} catch (error) {
  console.error('❌ Could not update .env file');
  process.exit(1);
}

console.log('\n📋 Next Steps:');
console.log('1. Go to https://auth0.com/ and create an account');
console.log('2. Create a new application:');
console.log('   - Name: "RFP CoPilot"');
console.log('   - Type: "Regular Web Application"');
console.log('');
console.log('3. Configure your Auth0 application URLs:');
console.log('   Allowed Callback URLs:');
console.log('   - http://localhost:3000/api/auth/callback');
console.log('   - http://localhost:3000/dashboard');
console.log('');
console.log('   Allowed Logout URLs:');
console.log('   - http://localhost:3000');
console.log('   - http://localhost:3000/api/auth/logout');
console.log('');
console.log('   Allowed Web Origins:');
console.log('   - http://localhost:3000');
console.log('');
console.log('4. Copy your Auth0 credentials to .env:');
console.log('   - Domain (e.g., your-tenant.auth0.com)');
console.log('   - Client ID');
console.log('   - Client Secret');
console.log('');
console.log('5. Update these values in your .env file:');
console.log(`   AUTH0_ISSUER_BASE_URL=https://your-tenant.auth0.com`);
console.log(`   AUTH0_CLIENT_ID=your-client-id`);
console.log(`   AUTH0_CLIENT_SECRET=your-client-secret`);
console.log(`   NEXT_PUBLIC_AUTH0_DOMAIN=your-tenant.auth0.com`);
console.log(`   NEXT_PUBLIC_AUTH0_CLIENT_ID=your-client-id`);
console.log('');
console.log('6. Restart your development server:');
console.log('   npm run dev');
console.log('');
console.log('🔒 Your Auth0 secret has been generated and saved!');
console.log('   Secret:', newSecret.substring(0, 10) + '...'); 