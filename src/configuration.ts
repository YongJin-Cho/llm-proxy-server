import { dirname, resolve } from 'node:path';
import { mkdirSync, readFileSync } from 'node:fs';

export type ProviderConfig = {
  baseUrl: string;
  apiKey: string;
  apiKeyEnv: string;
};

export type ModelRoute = {
  provider: string;
  providerModel: string;
};

export type AppConfig = {
  host: string;
  port: number;
  providers: Record<string, ProviderConfig>;
  models: Record<string, ModelRoute>;
  databasePath: string;
  maxBodyBytes: number;
};

type FileConfig = {
  host?: unknown;
  port?: unknown;
  databasePath?: unknown;
  maxBodyBytes?: unknown;
  providers?: unknown;
  models?: unknown;
};

const requiredString = (value: unknown, name: string) => {
  if (typeof value !== 'string' || value.trim() === '') throw new Error(`${name} must be a non-empty string`);
  return value.trim();
};

const positiveNumber = (value: unknown, name: string) => {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) throw new Error(`${name} must be a positive integer`);
  return parsed;
};

const loadFileConfig = (): FileConfig => {
  const path = resolve(process.cwd(), 'config.json');
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unable to read configuration';
    throw new Error(`invalid config.json: ${message}`);
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('invalid config.json: root must be an object');
  return parsed as FileConfig;
};

export function loadConfig(env = process.env): AppConfig {
  const file = loadFileConfig();
  const host = requiredString(file.host, 'host');
  const port = positiveNumber(file.port, 'port');
  const databasePath = requiredString(file.databasePath, 'databasePath');
  const maxBodyBytes = positiveNumber(file.maxBodyBytes, 'maxBodyBytes');
  if (!file.providers || typeof file.providers !== 'object' || Array.isArray(file.providers)) throw new Error('providers must be an object');
  if (!file.models || typeof file.models !== 'object' || Array.isArray(file.models)) throw new Error('models must be an object');

  const providers: Record<string, ProviderConfig> = {};
  for (const [name, raw] of Object.entries(file.providers)) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error(`providers.${name} must be an object`);
    const definition = raw as { baseUrl?: unknown; apiKeyEnv?: unknown };
    const baseUrl = requiredString(definition.baseUrl, `providers.${name}.baseUrl`);
    const apiKeyEnv = requiredString(definition.apiKeyEnv, `providers.${name}.apiKeyEnv`);
    const apiKey = env[apiKeyEnv];
    if (apiKey === undefined || apiKey === '') throw new Error(`missing provider secret environment variable: ${apiKeyEnv}`);
    providers[name] = { baseUrl, apiKey, apiKeyEnv };
  }
  if (Object.keys(providers).length === 0) throw new Error('providers must contain at least one provider');

  const models: Record<string, ModelRoute> = {};
  for (const [clientModel, raw] of Object.entries(file.models)) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error(`models.${clientModel} must be an object`);
    const definition = raw as { provider?: unknown; providerModel?: unknown };
    const provider = requiredString(definition.provider, `models.${clientModel}.provider`);
    const providerModel = requiredString(definition.providerModel, `models.${clientModel}.providerModel`);
    if (!providers[provider]) throw new Error(`models.${clientModel}.provider references unknown provider: ${provider}`);
    models[clientModel] = { provider, providerModel };
  }
  if (Object.keys(models).length === 0) throw new Error('models must contain at least one model');

  const config = { host, port, providers, models, databasePath, maxBodyBytes };
  mkdirSync(dirname(resolve(process.cwd(), databasePath)), { recursive: true });
  return config;
}
