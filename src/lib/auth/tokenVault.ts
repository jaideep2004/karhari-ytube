import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const SECRET_VERSION = 'v1';
const ENVELOPE_VERSION = 'tube-v1';

export type EncryptedTokenMap = {
  __encrypted: true;
  version: typeof ENVELOPE_VERSION;
  values: Record<string, string>;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

const getEncryptionKey = () => {
  const encoded = process.env.TOKEN_ENCRYPTION_KEY || process.env.DSP_CREDENTIAL_ENCRYPTION_KEY;
  if (!encoded) throw new Error('TOKEN_ENCRYPTION_KEY is not configured');
  const key = Buffer.from(encoded, 'base64');
  if (key.length !== 32) throw new Error('TOKEN_ENCRYPTION_KEY must be a 32-byte base64 value');
  return key;
};

const encryptValue = (value: unknown) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [SECRET_VERSION, iv.toString('base64'), tag.toString('base64'), encrypted.toString('base64')].join(':');
};

const decryptValue = (payload: string) => {
  const [version, iv, tag, encrypted] = payload.split(':');
  if (version !== SECRET_VERSION || !iv || !tag || !encrypted) throw new Error('Unsupported token secret format');
  const decipher = crypto.createDecipheriv(ALGORITHM, getEncryptionKey(), Buffer.from(iv, 'base64'));
  decipher.setAuthTag(Buffer.from(tag, 'base64'));
  const raw = Buffer.concat([decipher.update(Buffer.from(encrypted, 'base64')), decipher.final()]).toString('utf8');
  return JSON.parse(raw) as unknown;
};

export const isEncryptedTokenMap = (value: unknown): value is EncryptedTokenMap =>
  isRecord(value) && value.__encrypted === true && value.version === ENVELOPE_VERSION && isRecord(value.values);

export const encryptTokenMap = (tokens: Record<string, unknown> = {}): EncryptedTokenMap => {
  const values: Record<string, string> = {};
  for (const [k, v] of Object.entries(tokens)) {
    if (v === undefined || v === null || v === '') continue;
    values[k] = encryptValue(v);
  }
  return { __encrypted: true, version: ENVELOPE_VERSION, values };
};

export const encryptToken = (value: string): string => encryptValue(value);
export const decryptToken = (payload: string): string => {
  const v = decryptValue(payload);
  return typeof v === "string" ? v : JSON.stringify(v).replace(/^"|"$/g, "");
};

export const decryptTokenMap = (tokens: Record<string, unknown> = {}): Record<string, unknown> => {
  if (!isEncryptedTokenMap(tokens)) return { ...tokens };
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(tokens.values)) out[k] = decryptValue(v);
  return out;
};
