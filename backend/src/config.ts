import dotenv from 'dotenv';

dotenv.config();

interface EnvConfig {
  port: number;
  databaseUrl: string;
}

const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = process.env[key] || defaultValue;
  if (!value) {
    throw new Error(`Environment variable ${key} is required but not defined`);
  }
  return value;
};

export const config: EnvConfig = {
  port: parseInt(getEnvVar('PORT', '4000'), 10),
  databaseUrl: getEnvVar('DATABASE_URL'),
};
