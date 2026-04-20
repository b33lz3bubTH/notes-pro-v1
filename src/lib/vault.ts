import {
  CRYPTO_CONSTANTS,
  decryptString,
  deriveKey,
  encryptString,
  exportRawKey,
  generateSalt,
  importRawKey,
} from "./crypto";
import { getVaultRecord, putVaultRecord, type VaultRecord } from "./db";

const VERIFIER_PLAINTEXT = "scribes-codex-v1";
const SESSION_KEY_STORAGE = "scribes.codex.session-key";

export type VaultState = "unknown" | "none" | "locked" | "unlocked";

let currentKey: CryptoKey | null = null;
let state: VaultState = "unknown";
const listeners = new Set<(s: VaultState) => void>();

function setState(next: VaultState) {
  state = next;
  listeners.forEach((fn) => fn(state));
}

export function getVaultState(): VaultState {
  return state;
}

export function subscribeVaultState(fn: (s: VaultState) => void): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

export function getSessionKey(): CryptoKey {
  if (!currentKey) throw new Error("Vault is locked");
  return currentKey;
}

export function hasSessionKey(): boolean {
  return !!currentKey;
}

async function rehydrateFromSession(): Promise<boolean> {
  const hex = sessionStorage.getItem(SESSION_KEY_STORAGE);
  if (!hex) return false;
  try {
    currentKey = await importRawKey(hex);
    return true;
  } catch {
    sessionStorage.removeItem(SESSION_KEY_STORAGE);
    currentKey = null;
    return false;
  }
}

async function persistSessionKey(key: CryptoKey) {
  const hex = await exportRawKey(key);
  sessionStorage.setItem(SESSION_KEY_STORAGE, hex);
}

export async function initVault(): Promise<VaultState> {
  const record = await getVaultRecord();
  if (!record) {
    setState("none");
    return "none";
  }
  const rehydrated = await rehydrateFromSession();
  setState(rehydrated ? "unlocked" : "locked");
  return state;
}

export async function createVault(password: string): Promise<void> {
  if (!password || password.length < 4) {
    throw new Error("Password must be at least 4 characters");
  }
  const existing = await getVaultRecord();
  if (existing) throw new Error("Vault already exists");

  const salt = generateSalt();
  const iterations = CRYPTO_CONSTANTS.PBKDF2_ITERATIONS;
  const key = await deriveKey(password, salt, iterations);
  const verifier = await encryptString(key, VERIFIER_PLAINTEXT);

  const record: VaultRecord = {
    id: "main",
    version: 1,
    salt,
    iterations,
    verifier,
    createdAt: Date.now(),
  };
  await putVaultRecord(record);

  currentKey = key;
  await persistSessionKey(key);
  setState("unlocked");
}

export async function unlockVault(password: string): Promise<void> {
  const record = await getVaultRecord();
  if (!record) throw new Error("No vault to unlock");

  const key = await deriveKey(password, record.salt, record.iterations);
  let plain: string;
  try {
    plain = await decryptString(key, record.verifier);
  } catch {
    throw new Error("Wrong password");
  }
  if (plain !== VERIFIER_PLAINTEXT) throw new Error("Wrong password");

  currentKey = key;
  await persistSessionKey(key);
  setState("unlocked");
}

export function lockVault(): void {
  currentKey = null;
  sessionStorage.removeItem(SESSION_KEY_STORAGE);
  setState("locked");
}
