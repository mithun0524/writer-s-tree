import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { SerializedEditorState } from 'lexical';

interface VersionHistoryDB extends DBSchema {
  snapshots: {
    key: number;
    value: {
      id: number;
      timestamp: number;
      editorState: SerializedEditorState;
      wordCount: number;
      preview: string;
    };
    indexes: { timestamp: number };
  };
}

let db: IDBPDatabase<VersionHistoryDB> | null = null;

export async function initVersionHistoryDB() {
  if (db) return db;

  db = await openDB<VersionHistoryDB>('lexical-version-history', 1, {
    upgrade(db) {
      const store = db.createObjectStore('snapshots', {
        keyPath: 'id',
        autoIncrement: true,
      });
      store.createIndex('timestamp', 'timestamp');
    },
  });

  return db;
}

export async function saveSnapshot(
  editorState: SerializedEditorState,
  wordCount: number,
  preview: string
) {
  const database = await initVersionHistoryDB();
  
  await database.add('snapshots', {
    id: Date.now(),
    timestamp: Date.now(),
    editorState,
    wordCount,
    preview,
  });
}

export async function getAllSnapshots() {
  const database = await initVersionHistoryDB();
  return await database.getAllFromIndex('snapshots', 'timestamp');
}

export async function deleteSnapshot(id: number) {
  const database = await initVersionHistoryDB();
  await database.delete('snapshots', id);
}

export async function clearAllSnapshots() {
  const database = await initVersionHistoryDB();
  const tx = database.transaction('snapshots', 'readwrite');
  await tx.store.clear();
  await tx.done;
}
