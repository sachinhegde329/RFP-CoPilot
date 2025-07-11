#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔐 Complete Auth0 Setup for RFP CoPilot\n');

console.log('📋 Prerequisites:');
console.log('1. You need to have created an Auth0 application');
console.log('2. You need your Auth0 credentials ready');
console.log('');

console.log('🔗 If you haven\'t created an Auth0 application yet:');
console.log('1. Go to https://auth0.com/ and sign up/login');
console.log('2. Create a new application: "RFP CoPilot" (Regular Web Application)');
console.log('3. Configure these URLs in your Auth0 app settings:');
console.log('   - Allowed Callback URLs: http://localhost:3000/api/auth/callback, http://localhost:3000/dashboard');
console.log('   - Allowed Logout URLs: http://localhost:3000, http://localhost:3000/api/auth/logout');
console.log('   - Allowed Web Origins: http://localhost:3000');
console.log('');

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function completeSetup() {
  try {
    console.log('📝 Please provide your Auth0 credentials:\n');

    const domain = await askQuestion('Enter your Auth0 Domain (e.g., your-tenant.auth0.com): ');
    const clientId = await askQuestion('Enter your Auth0 Client ID: ');
    const clientSecret = await askQuestion('Enter your Auth0 Client Secret: ');

    if (!domain || !clientId || !clientSecret) {
      console.log('❌ All fields are required. Please try again.');
      rl.close();
      return;
    }

    // Read current .env file
    const envPath = path.join(process.cwd(), '.env');
    let envContent = fs.readFileSync(envPath, 'utf8');

    // Update the values
    envContent = envContent.replace(/AUTH0_ISSUER_BASE_URL=/, `AUTH0_ISSUER_BASE_URL=https://${domain}`);
    envContent = envContent.replace(/AUTH0_CLIENT_ID=/, `AUTH0_CLIENT_ID=${clientId}`);
    envContent = envContent.replace(/AUTH0_CLIENT_SECRET=/, `AUTH0_CLIENT_SECRET=${clientSecret}`);
    envContent = envContent.replace(/NEXT_PUBLIC_AUTH0_DOMAIN=/, `NEXT_PUBLIC_AUTH0_DOMAIN=${domain}`);
    envContent = envContent.replace(/NEXT_PUBLIC_AUTH0_CLIENT_ID=/, `NEXT_PUBLIC_AUTH0_CLIENT_ID=${clientId}`);

    // Write back to .env file
    fs.writeFileSync(envPath, envContent);

    console.log('\n✅ Auth0 configuration updated successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Restart your development server: npm run dev');
    console.log('2. Test authentication by visiting: http://localhost:3000/megacorp/rfps');
    console.log('3. You should be redirected to Auth0 for login');
    console.log('\n🔒 Your Auth0 setup is now complete!');

  } catch (error) {
    console.error('❌ Error updating configuration:', error.message);
  } finally {
    rl.close();
  }
}

completeSetup(); 