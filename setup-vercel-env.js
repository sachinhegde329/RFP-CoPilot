#!/usr/bin/env node

/**
 * Script to help set up Vercel environment variables
 * Run this script to get the environment variables you need to add to Vercel
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Vercel Environment Variables Setup\n');

// Read local .env file
const envPath = path.join(process.cwd(), '.env');
let localEnv = {};

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      localEnv[key.trim()] = valueParts.join('=').trim();
    }
  });
}

// Define required environment variables for Vercel
const requiredEnvVars = {
  // AI/ML Services
  'GEMINI_API_KEY': {
    description: 'Google Gemini API key for AI features',
    value: localEnv.GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY_HERE',
    environments: ['Production', 'Preview', 'Development']
  },
  
  // Vector Database
  'PINECONE_API_KEY': {
    description: 'Pinecone API key for vector database (optional)',
    value: localEnv.PINECONE_API_KEY || 'YOUR_PINECONE_API_KEY_HERE',
    environments: ['Production', 'Preview', 'Development']
  },
  
  // Auth0 Configuration
  'AUTH0_SECRET': {
    description: 'Auth0 secret for session encryption',
    value: localEnv.AUTH0_SECRET || 'YOUR_AUTH0_SECRET_HERE',
    environments: ['Production', 'Preview', 'Development']
  },
  'AUTH0_BASE_URL': {
    description: 'Base URL for Auth0 (production)',
    value: 'https://rfp-co-pilot.vercel.app',
    environments: ['Production']
  },
  'AUTH0_BASE_URL_PREVIEW': {
    description: 'Base URL for Auth0 (preview/development)',
    value: 'http://localhost:3000',
    environments: ['Preview', 'Development']
  },
  'AUTH0_ISSUER_BASE_URL': {
    description: 'Auth0 issuer base URL',
    value: localEnv.AUTH0_ISSUER_BASE_URL || 'https://YOUR_DOMAIN.auth0.com',
    environments: ['Production', 'Preview', 'Development']
  },
  'AUTH0_CLIENT_ID': {
    description: 'Auth0 client ID',
    value: localEnv.AUTH0_CLIENT_ID || 'YOUR_AUTH0_CLIENT_ID_HERE',
    environments: ['Production', 'Preview', 'Development']
  },
  'AUTH0_CLIENT_SECRET': {
    description: 'Auth0 client secret',
    value: localEnv.AUTH0_CLIENT_SECRET || 'YOUR_AUTH0_CLIENT_SECRET_HERE',
    environments: ['Production', 'Preview', 'Development']
  },
  
  // App Configuration
  'NEXT_PUBLIC_APP_URL': {
    description: 'Public app URL',
    value: 'https://rfp-co-pilot.vercel.app',
    environments: ['Production']
  },
  'NEXT_PUBLIC_APP_URL_PREVIEW': {
    description: 'Public app URL for preview/development',
    value: 'http://localhost:3000',
    environments: ['Preview', 'Development']
  }
};

console.log('📋 Required Environment Variables for Vercel:\n');

Object.entries(requiredEnvVars).forEach(([key, config]) => {
  console.log(`🔑 ${key}`);
  console.log(`   Description: ${config.description}`);
  console.log(`   Value: ${config.value}`);
  console.log(`   Environments: ${config.environments.join(', ')}`);
  console.log('');
});

console.log('📝 Instructions:');
console.log('1. Go to your Vercel dashboard: https://vercel.com/dashboard');
console.log('2. Select your RFP-CoPilot project');
console.log('3. Go to Settings → Environment Variables');
console.log('4. Add each variable above with the correct value and environment settings');
console.log('5. Click "Save" after adding each variable');
console.log('6. Redeploy your project after adding all variables\n');

console.log('⚠️  Important Notes:');
console.log('- Replace placeholder values with your actual API keys and secrets');
console.log('- Make sure to select the correct environments for each variable');
console.log('- The GEMINI_API_KEY is required for the app to function');
console.log('- Auth0 variables are required if you want authentication');
console.log('- PINECONE_API_KEY is optional but recommended for production\n');

console.log('🎯 Quick Setup Commands:');
console.log('If you have Vercel CLI installed and are logged in:');
console.log('vercel env add GEMINI_API_KEY');
console.log('vercel env add PINECONE_API_KEY');
console.log('vercel env add AUTH0_SECRET');
console.log('vercel env add AUTH0_BASE_URL');
console.log('vercel env add AUTH0_ISSUER_BASE_URL');
console.log('vercel env add AUTH0_CLIENT_ID');
console.log('vercel env add AUTH0_CLIENT_SECRET');
console.log('vercel env add NEXT_PUBLIC_APP_URL'); 