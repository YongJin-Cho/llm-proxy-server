import { dirname } from 'node:path';
import { mkdirSync } from 'node:fs';

export type AppConfig = {
  host: string;
  port: number;
  providerUrl: string;
  providerApiKey: string;
  databasePath: string;
  maxBodyBytes: number;
};

const positiveNumber = (value: string | undefined, fallback: number, name: string) => {
  const parsed = Number(value ?? fallback);
  if (!Number.isFinite(parsed) || parsed <= 0) throw new Error(`${name} must be a positive number`);
  return parsed;
};

export function loadConfig(env = process.env): AppConfig {
  const config = {
    host: env.HOST ?? '127.0.0.1',
    port: positiveNumber(env.PORT, 3000, 'PORT'),
    providerUrl: env.PROVIDER_URL ?? 'https://api.openai.com/v1/responses',
    providerApiKey: env.PROVIDER_API_KEY ?? '',
    databasePath: env.SQLITE_PATH ?? './data/traffic.db',
    maxBodyBytes: positiveNumber(env.MAX_BODY_BYTES, 65536, 'MAX_BODY_BYTES'),
  };
  mkdirSync(dirname(config.databasePath), { recursive: true });
  return config;
}
