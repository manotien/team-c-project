#!/usr/bin/env tsx

import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local, then .env as fallback
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

const requiredEnvVars = [
  'DATABASE_URL',
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET',
  'LINE_CLIENT_ID',
  'LINE_CLIENT_SECRET',
  'NEXT_PUBLIC_LINE_LIFF_ID',
  'LINE_CHANNEL_ACCESS_TOKEN',
  'LINE_CHANNEL_SECRET',
  'GCP_PROJECT_ID',
  'GCP_LOCATION',
  'GCP_PROCESSOR_ID',
  'REDIS_HOST',
  'REDIS_PORT',
] as const;

const optionalEnvVars = [
  'REDIS_PASSWORD',
  'UPLOAD_DIR',
  'NEXT_PUBLIC_UPLOAD_URL',
  'NEXT_PUBLIC_ENABLE_OCR_DEBUG',
  'NEXT_PUBLIC_DEMO_MODE',
] as const;

function validateEnv() {
  console.log('🔍 Validating environment variables...\n');

  const missing: string[] = [];
  const warnings: string[] = [];

  // Check required variables
  requiredEnvVars.forEach((varName) => {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  });

  // Check GOOGLE_APPLICATION_CREDENTIALS file exists
  const gcpCreds = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (gcpCreds && !require('fs').existsSync(gcpCreds)) {
    warnings.push(`GOOGLE_APPLICATION_CREDENTIALS file not found: ${gcpCreds}`);
  }

  // Check for weak NEXTAUTH_SECRET
  const nextAuthSecret = process.env.NEXTAUTH_SECRET;
  if (nextAuthSecret && nextAuthSecret.length < 32) {
    warnings.push('NEXTAUTH_SECRET should be at least 32 characters (run: openssl rand -base64 32)');
  }

  // Report results
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:\n');
    missing.forEach((varName) => {
      console.error(`   - ${varName}`);
    });
    console.error('\n📝 Copy .env.example to .env.local and fill in the values.\n');
    process.exit(1);
  }

  if (warnings.length > 0) {
    console.warn('⚠️  Warnings:\n');
    warnings.forEach((warning) => {
      console.warn(`   - ${warning}`);
    });
    console.warn('');
  }

  console.log('✅ All required environment variables are set!\n');
}

validateEnv();
