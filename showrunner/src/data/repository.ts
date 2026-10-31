import type { Node } from '../domain/types';

/**
 * Storage boundary. The app only talks to this interface, so moving from
 * on-device storage to a cloud backend (for accounts, sync and paid plans)
 * means adding a new implementation, not rewriting the UI.
 */
export interface Repository {
  list(ownerId: string): Promise<Node[]>;
  save(nodes: Node[]): Promise<void>;
  remove(ids: string[]): Promise<void>;
}

const DB_NAME = 'showrunner';
const STORE = 'nodes';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const store = req.result.createObjectStore(STORE, { keyPath: 'id' });
      store.createIndex('ownerId', 'ownerId');
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function done(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

/** Keeps everything in the browser's IndexedDB on this Mac. */
export class LocalRepository implements Repository {
  private db = openDb();

  async list(ownerId: string): Promise<Node[]> {
    const db = await this.db;
    return new Promise((resolve, reject) => {
      const req = db.transaction(STORE).objectStore(STORE).index('ownerId').getAll(ownerId);
      req.onsuccess = () => resolve(req.result as Node[]);
      req.onerror = () => reject(req.error);
    });
  }

  async save(nodes: Node[]): Promise<void> {
    const tx = (await this.db).transaction(STORE, 'readwrite');
    for (const n of nodes) tx.objectStore(STORE).put(n);
    return done(tx);
  }

  async remove(ids: string[]): Promise<void> {
    const tx = (await this.db).transaction(STORE, 'readwrite');
    for (const id of ids) tx.objectStore(STORE).delete(id);
    return done(tx);
  }
}
