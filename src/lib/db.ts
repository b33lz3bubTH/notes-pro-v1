import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import {
  decryptBlob,
  decryptString,
  encryptBlob,
  encryptString,
} from "./crypto";
import { getSessionKey } from "./vault";

export interface MediaAttachment {
  id: string;
  name: string;
  type: string;
  blob: Blob;
  createdAt: number;
}

export interface Note {
  id: string;
  title: string;
  body: string;
  createdAt: number;
  updatedAt: number;
  mediaIds: string[];
}

export interface VaultRecord {
  id: "main";
  version: number;
  salt: Uint8Array;
  iterations: number;
  verifier: Uint8Array;
  createdAt: number;
}

interface StoredNote {
  id: string;
  titleEnc: Uint8Array;
  bodyEnc: Uint8Array;
  createdAt: number;
  updatedAt: number;
  mediaIds: string[];
}

interface StoredMedia {
  id: string;
  nameEnc: Uint8Array;
  type: string;
  blobEnc: Blob;
  createdAt: number;
}

interface ScribeDB extends DBSchema {
  notes: {
    key: string;
    value: StoredNote;
    indexes: { "by-updated": number };
  };
  media: {
    key: string;
    value: StoredMedia;
  };
  vault: {
    key: string;
    value: VaultRecord;
  };
}

let dbPromise: Promise<IDBPDatabase<ScribeDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<ScribeDB>("scribe-codex", 2, {
      upgrade(db, oldVersion) {
        if (oldVersion < 2) {
          if (db.objectStoreNames.contains("notes")) db.deleteObjectStore("notes");
          if (db.objectStoreNames.contains("media")) db.deleteObjectStore("media");
          const notes = db.createObjectStore("notes", { keyPath: "id" });
          notes.createIndex("by-updated", "updatedAt");
          db.createObjectStore("media", { keyPath: "id" });
          db.createObjectStore("vault", { keyPath: "id" });
        }
      },
    });
  }
  return dbPromise;
}

const slug = () =>
  Math.random().toString(36).slice(2, 7).toUpperCase();

const uid = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export async function getVaultRecord(): Promise<VaultRecord | undefined> {
  const db = await getDB();
  return db.get("vault", "main");
}

export async function putVaultRecord(record: VaultRecord): Promise<void> {
  const db = await getDB();
  await db.put("vault", record);
}

async function storedToNote(s: StoredNote): Promise<Note> {
  const key = getSessionKey();
  const [title, body] = await Promise.all([
    decryptString(key, s.titleEnc),
    decryptString(key, s.bodyEnc),
  ]);
  return {
    id: s.id,
    title,
    body,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
    mediaIds: s.mediaIds,
  };
}

async function noteToStored(n: Note): Promise<StoredNote> {
  const key = getSessionKey();
  const [titleEnc, bodyEnc] = await Promise.all([
    encryptString(key, n.title),
    encryptString(key, n.body),
  ]);
  return {
    id: n.id,
    titleEnc,
    bodyEnc,
    createdAt: n.createdAt,
    updatedAt: n.updatedAt,
    mediaIds: n.mediaIds,
  };
}

async function storedToMedia(s: StoredMedia): Promise<MediaAttachment> {
  const key = getSessionKey();
  const [name, blob] = await Promise.all([
    decryptString(key, s.nameEnc),
    decryptBlob(key, s.blobEnc, s.type),
  ]);
  return { id: s.id, name, type: s.type, blob, createdAt: s.createdAt };
}

export async function listNotes(): Promise<Note[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex("notes", "by-updated");
  const sorted = all.reverse();
  return Promise.all(sorted.map(storedToNote));
}

export async function getNote(id: string): Promise<Note | undefined> {
  const db = await getDB();
  const s = await db.get("notes", id);
  if (!s) return;
  return storedToNote(s);
}

export async function createNote(input: {
  title?: string;
  body?: string;
  mediaIds?: string[];
}): Promise<Note> {
  const db = await getDB();
  const now = Date.now();
  const title = input.title?.trim() || `Untitled - ${slug()}`;
  const note: Note = {
    id: uid(),
    title,
    body: input.body?.trim() || "",
    mediaIds: input.mediaIds ?? [],
    createdAt: now,
    updatedAt: now,
  };
  await db.put("notes", await noteToStored(note));
  return note;
}

export async function updateNote(
  id: string,
  patch: Partial<Pick<Note, "title" | "body" | "mediaIds">>,
): Promise<Note | undefined> {
  const db = await getDB();
  const stored = await db.get("notes", id);
  if (!stored) return;
  const existing = await storedToNote(stored);
  const updated: Note = {
    ...existing,
    ...patch,
    title:
      patch.title !== undefined
        ? patch.title.trim() || `Untitled - ${slug()}`
        : existing.title,
    updatedAt: Date.now(),
  };
  await db.put("notes", await noteToStored(updated));
  return updated;
}

export async function deleteNote(id: string) {
  const db = await getDB();
  const note = await db.get("notes", id);
  if (note) {
    await Promise.all(note.mediaIds.map((mid) => db.delete("media", mid)));
  }
  await db.delete("notes", id);
}

export async function addMedia(file: File): Promise<MediaAttachment> {
  const db = await getDB();
  const key = getSessionKey();
  const type = file.type || "application/octet-stream";
  const [nameEnc, blobEnc] = await Promise.all([
    encryptString(key, file.name),
    encryptBlob(key, file),
  ]);
  const stored: StoredMedia = {
    id: uid(),
    nameEnc,
    type,
    blobEnc,
    createdAt: Date.now(),
  };
  await db.put("media", stored);
  return { id: stored.id, name: file.name, type, blob: file, createdAt: stored.createdAt };
}

export async function getMedia(id: string): Promise<MediaAttachment | undefined> {
  const db = await getDB();
  const s = await db.get("media", id);
  if (!s) return;
  return storedToMedia(s);
}

export async function getMediaMany(ids: string[]): Promise<MediaAttachment[]> {
  const db = await getDB();
  const raw = await Promise.all(ids.map((id) => db.get("media", id)));
  const filtered = raw.filter((m): m is StoredMedia => !!m);
  return Promise.all(filtered.map(storedToMedia));
}

export async function deleteMedia(id: string) {
  const db = await getDB();
  await db.delete("media", id);
}
