import { openDB, type DBSchema, type IDBPDatabase } from "idb";

export interface MediaAttachment {
  id: string;
  name: string;
  type: string; // mime
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

interface ScribeDB extends DBSchema {
  notes: {
    key: string;
    value: Note;
    indexes: { "by-updated": number };
  };
  media: {
    key: string;
    value: MediaAttachment;
  };
}

let dbPromise: Promise<IDBPDatabase<ScribeDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<ScribeDB>("scribe-codex", 1, {
      upgrade(db) {
        const notes = db.createObjectStore("notes", { keyPath: "id" });
        notes.createIndex("by-updated", "updatedAt");
        db.createObjectStore("media", { keyPath: "id" });
      },
    });
  }
  return dbPromise;
}

const slug = () =>
  Math.random().toString(36).slice(2, 7).toUpperCase();

const uid = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export async function listNotes(): Promise<Note[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex("notes", "by-updated");
  return all.reverse();
}

export async function getNote(id: string) {
  const db = await getDB();
  return db.get("notes", id);
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
  await db.put("notes", note);
  return note;
}

export async function updateNote(
  id: string,
  patch: Partial<Pick<Note, "title" | "body" | "mediaIds">>,
): Promise<Note | undefined> {
  const db = await getDB();
  const existing = await db.get("notes", id);
  if (!existing) return;
  const updated: Note = {
    ...existing,
    ...patch,
    title:
      patch.title !== undefined
        ? patch.title.trim() || `Untitled - ${slug()}`
        : existing.title,
    updatedAt: Date.now(),
  };
  await db.put("notes", updated);
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
  const media: MediaAttachment = {
    id: uid(),
    name: file.name,
    type: file.type || "application/octet-stream",
    blob: file,
    createdAt: Date.now(),
  };
  await db.put("media", media);
  return media;
}

export async function getMedia(id: string) {
  const db = await getDB();
  return db.get("media", id);
}

export async function getMediaMany(ids: string[]) {
  const db = await getDB();
  const results = await Promise.all(ids.map((id) => db.get("media", id)));
  return results.filter((m): m is MediaAttachment => !!m);
}

export async function deleteMedia(id: string) {
  const db = await getDB();
  await db.delete("media", id);
}
