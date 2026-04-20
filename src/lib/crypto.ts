const PBKDF2_ITERATIONS = 310_000;
const SALT_BYTES = 16;
const IV_BYTES = 12;
const KEY_BITS = 256;

const enc = new TextEncoder();
const dec = new TextDecoder();

export function randomBytes(n: number): Uint8Array {
  const b = new Uint8Array(n);
  crypto.getRandomValues(b);
  return b;
}

export const generateSalt = () => randomBytes(SALT_BYTES);

export async function deriveKey(
  password: string,
  salt: Uint8Array,
  iterations: number = PBKDF2_ITERATIONS,
): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: KEY_BITS },
    true,
    ["encrypt", "decrypt"],
  );
}

function packIvAndCipher(iv: Uint8Array, cipher: ArrayBuffer): Uint8Array {
  const out = new Uint8Array(iv.byteLength + cipher.byteLength);
  out.set(iv, 0);
  out.set(new Uint8Array(cipher), iv.byteLength);
  return out;
}

function unpackIvAndCipher(buf: Uint8Array): { iv: Uint8Array; cipher: Uint8Array } {
  return { iv: buf.slice(0, IV_BYTES), cipher: buf.slice(IV_BYTES) };
}

export async function encryptBytes(key: CryptoKey, plaintext: Uint8Array): Promise<Uint8Array> {
  const iv = randomBytes(IV_BYTES);
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext);
  return packIvAndCipher(iv, cipher);
}

export async function decryptBytes(key: CryptoKey, payload: Uint8Array): Promise<Uint8Array> {
  const { iv, cipher } = unpackIvAndCipher(payload);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, cipher);
  return new Uint8Array(plain);
}

export async function encryptString(key: CryptoKey, plaintext: string): Promise<Uint8Array> {
  return encryptBytes(key, enc.encode(plaintext));
}

export async function decryptString(key: CryptoKey, payload: Uint8Array): Promise<string> {
  const plain = await decryptBytes(key, payload);
  return dec.decode(plain);
}

export async function encryptBlob(key: CryptoKey, blob: Blob): Promise<Blob> {
  const buf = new Uint8Array(await blob.arrayBuffer());
  const payload = await encryptBytes(key, buf);
  return new Blob([payload], { type: "application/octet-stream" });
}

export async function decryptBlob(
  key: CryptoKey,
  encrypted: Blob,
  mime: string,
): Promise<Blob> {
  const buf = new Uint8Array(await encrypted.arrayBuffer());
  const plain = await decryptBytes(key, buf);
  return new Blob([plain], { type: mime });
}

export function bytesToHex(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += bytes[i].toString(16).padStart(2, "0");
  return s;
}

export function hexToBytes(hex: string): Uint8Array {
  const len = hex.length / 2;
  const out = new Uint8Array(len);
  for (let i = 0; i < len; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
  return out;
}

export async function exportRawKey(key: CryptoKey): Promise<string> {
  const raw = await crypto.subtle.exportKey("raw", key);
  return bytesToHex(new Uint8Array(raw));
}

export async function importRawKey(hex: string): Promise<CryptoKey> {
  const raw = hexToBytes(hex);
  return crypto.subtle.importKey(
    "raw",
    raw,
    { name: "AES-GCM", length: KEY_BITS },
    true,
    ["encrypt", "decrypt"],
  );
}

export const CRYPTO_CONSTANTS = {
  PBKDF2_ITERATIONS,
  SALT_BYTES,
  IV_BYTES,
  KEY_BITS,
} as const;
