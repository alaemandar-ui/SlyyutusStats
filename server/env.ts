import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// 1. Load .env from workspace root
const rootDir = process.cwd();
const envPath = path.resolve(rootDir, '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

// 2. Fallback to .env.example for any missing non-secret config defaults
const examplePath = path.resolve(rootDir, '.env.example');
if (fs.existsSync(examplePath)) {
  try {
    const exampleConfig = dotenv.parse(fs.readFileSync(examplePath));
    for (const key in exampleConfig) {
      if (!process.env[key]) {
        process.env[key] = exampleConfig[key];
      }
    }
  } catch (err) {
    console.error('[Env] Error parsing .env.example fallback:', err);
  }
}

// Safe diagnostic logging (Never prints actual secrets)
const hasClientId = Boolean(process.env.KICK_CLIENT_ID && !process.env.KICK_CLIENT_ID.startsWith('replace_'));
const hasClientSecret = Boolean(process.env.KICK_CLIENT_SECRET && !process.env.KICK_CLIENT_SECRET.startsWith('replace_'));
const redirectUri = process.env.KICK_REDIRECT_URI || 'http://127.0.0.1:3000/auth/callback';

console.log('[Kick Configuration Initialized]');
console.log('  CLIENT_ID present:', hasClientId);
console.log('  CLIENT_SECRET present:', hasClientSecret);
console.log('  REDIRECT_URI value:', redirectUri);
