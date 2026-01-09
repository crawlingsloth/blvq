import dotenv from 'dotenv';
import type { Config } from './types.js';

dotenv.config();

function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const config: Config = {
  databaseUrl: getEnvVar('DATABASE_URL'),
  supabaseUrl: getEnvVar('SUPABASE_URL'),
  supabaseAnonKey: getEnvVar('SUPABASE_ANON_KEY'),
  supabaseServiceRoleKey: getEnvVar('SUPABASE_SERVICE_ROLE_KEY'),
  jwtSecret: getEnvVar('JWT_SECRET'),
  jwtAlgorithm: getEnvVar('JWT_ALGORITHM', 'HS256'),
  jwtExpiration: getEnvVar('JWT_EXPIRATION', '24h'),
  ewityApiBaseUrl: getEnvVar('EWITY_API_BASE_URL'),
  ewityApiToken: getEnvVar('EWITY_API_TOKEN'),
  port: parseInt(getEnvVar('PORT', '8987'), 10),
  nodeEnv: getEnvVar('NODE_ENV', 'development'),
};
