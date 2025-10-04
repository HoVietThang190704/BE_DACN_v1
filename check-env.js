#!/usr/bin/env node
/**
 * Environment Configuration Checker
 * Kiểm tra tính hợp lệ của các biến môi trường
 */

const fs = require('fs');
const path = require('path');

const ENV_FILE = path.join(__dirname, '.env');
const ENV_EXAMPLE = path.join(__dirname, '.env.example');

console.log('🔍 Checking environment configuration...\n');

// Check if .env file exists
if (!fs.existsSync(ENV_FILE)) {
  console.error('❌ .env file not found!');
  console.log('💡 Create .env file from template:');
  console.log('   cp .env.example .env');
  process.exit(1);
}

// Load environment variables
require('dotenv').config();

const requiredVars = [
  'MONGODB_URI',
  'JWT_SECRET',
  'NODE_ENV'
];

const optionalVars = [
  'PORT',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'SMS_API_KEY'
];

let hasErrors = false;

console.log('📋 Required Variables:');
requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    console.log(`❌ ${varName}: Missing`);
    hasErrors = true;
  } else {
    // Mask sensitive values
    const displayValue = varName.includes('SECRET') || varName.includes('URI') 
      ? `${value.substring(0, 10)}...` 
      : value;
    console.log(`✅ ${varName}: ${displayValue}`);
  }
});

console.log('\n📋 Optional Variables:');
optionalVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    const displayValue = varName.includes('SECRET') || varName.includes('KEY') 
      ? `${value.substring(0, 10)}...` 
      : value;
    console.log(`✅ ${varName}: ${displayValue}`);
  } else {
    console.log(`⚪ ${varName}: Not set (optional)`);
  }
});

console.log('\n🔒 Security Check:');

// Check JWT_SECRET strength
const jwtSecret = process.env.JWT_SECRET;
if (jwtSecret) {
  if (jwtSecret.length < 32) {
    console.log('⚠️  JWT_SECRET is too short (recommended: 32+ characters)');
    hasErrors = true;
  } else if (jwtSecret === 'your-super-secret-jwt-key-change-in-production') {
    console.log('⚠️  JWT_SECRET is using default value - change it!');
    hasErrors = true;
  } else {
    console.log('✅ JWT_SECRET looks secure');
  }
}

// Check NODE_ENV
const nodeEnv = process.env.NODE_ENV;
if (nodeEnv === 'production') {
  console.log('🚀 Production environment detected');
  
  // Additional production checks
  if (process.env.MONGODB_URI && process.env.MONGODB_URI.includes('localhost')) {
    console.log('⚠️  Using localhost MongoDB in production');
  }
} else {
  console.log('🔧 Development environment');
}

console.log('\n' + '='.repeat(50));

if (hasErrors) {
  console.log('❌ Configuration has issues. Please fix them before running the app.');
  process.exit(1);
} else {
  console.log('✅ Environment configuration looks good!');
  console.log('🚀 Ready to start the application with: npm run dev');
}