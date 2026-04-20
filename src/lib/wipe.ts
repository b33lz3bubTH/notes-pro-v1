const DB_NAME = "scribe-codex";
const SESSION_KEY_STORAGE = "scribes.codex.session-key";

function deleteDatabase(name: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.deleteDatabase(name);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    req.onblocked = () => resolve();
  });
}

export async function wipeAll(opts: { skipConfirm?: boolean } = {}): Promise<void> {
  if (!opts.skipConfirm) {
    const ok = confirm(
      "This will destroy ALL scrolls, relics, and the vault seal itself.\n" +
      "Encrypted data will be unrecoverable.\n\nProceed?",
    );
    if (!ok) {
      console.info("[scribe] wipe cancelled");
      return;
    }
  }
  sessionStorage.removeItem(SESSION_KEY_STORAGE);
  await deleteDatabase(DB_NAME);
  console.info("[scribe] vault and all data destroyed — reloading");
  location.reload();
}

export async function wipeNotes(opts: { skipConfirm?: boolean } = {}): Promise<void> {
  if (!opts.skipConfirm) {
    const ok = confirm(
      "This will destroy ALL scrolls and relics, but keep thy password.\n\nProceed?",
    );
    if (!ok) {
      console.info("[scribe] wipe cancelled");
      return;
    }
  }
  const { openDB } = await import("idb");
  const db = await openDB(DB_NAME);
  if (db.objectStoreNames.contains("notes") && db.objectStoreNames.contains("media")) {
    const tx = db.transaction(["notes", "media"], "readwrite");
    await Promise.all([tx.objectStore("notes").clear(), tx.objectStore("media").clear()]);
    await tx.done;
  }
  db.close();
  console.info("[scribe] scrolls and relics destroyed — reloading");
  location.reload();
}

export function registerWindowHelpers() {
  const w = window as unknown as {
    __scribeWipeAll?: typeof wipeAll;
    __scribeWipeNotes?: typeof wipeNotes;
  };
  w.__scribeWipeAll = wipeAll;
  w.__scribeWipeNotes = wipeNotes;

  console.info(
    "%c⚜ Scribe's Codex — safety helpers%c\n" +
    "  window.__scribeWipeNotes()  — destroy scrolls + relics, keep password\n" +
    "  window.__scribeWipeAll()    — destroy everything incl. vault seal\n" +
    "  Pass { skipConfirm: true } to skip the prompt.",
    "color: #c9a43a; font-weight: bold;",
    "color: inherit;",
  );
}
