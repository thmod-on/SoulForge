import type { SyncConflict, SyncEnvelope, SyncPushChange, SyncResourceType } from "../sync/types";
import { syncKey } from "../sync/types";

const databaseName = "soulforge";
const databaseVersion = 5;
const queueStore = "syncQueue";
const metadataStore = "syncMetadata";
const conflictStore = "syncConflicts";

export function ensureSyncStores(database: IDBDatabase): void {
  if (!database.objectStoreNames.contains(queueStore)) database.createObjectStore(queueStore, { keyPath: "key" });
  if (!database.objectStoreNames.contains(metadataStore)) database.createObjectStore(metadataStore, { keyPath: "key" });
  if (!database.objectStoreNames.contains(conflictStore)) database.createObjectStore(conflictStore, { keyPath: "key" });
}

export type QueuedSyncChange = SyncPushChange & { key: string; queuedAt: string };
export type SyncMetadata = { key: string; revision: number; updatedAt: string };

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, databaseVersion);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains("characters")) database.createObjectStore("characters", { keyPath: "id" });
      if (!database.objectStoreNames.contains("customDefinitions")) database.createObjectStore("customDefinitions", { keyPath: "id" });
      if (!database.objectStoreNames.contains("installedPacks")) database.createObjectStore("installedPacks", { keyPath: "id" });
      if (!database.objectStoreNames.contains("definitionOverrides")) database.createObjectStore("definitionOverrides", { keyPath: "id" });
      ensureSyncStores(database);
    };
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

async function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function enqueueSyncChange(type: SyncResourceType, id: string, payload?: unknown, deleted = false): Promise<void> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction([queueStore, metadataStore], "readwrite");
    const key = syncKey(type, id);
    const metadata = await requestResult(transaction.objectStore(metadataStore).get(key)) as SyncMetadata | undefined;
    transaction.objectStore(queueStore).put({ key, mutationId: crypto.randomUUID(), type, id, payload, deleted, expectedRevision: metadata?.revision ?? 0, queuedAt: new Date().toISOString() } satisfies QueuedSyncChange);
    await transactionComplete(transaction);
  } finally {
    database.close();
  }
}

export async function listQueuedSyncChanges(): Promise<QueuedSyncChange[]> {
  const database = await openDatabase();
  try {
    return await requestResult(database.transaction(queueStore, "readonly").objectStore(queueStore).getAll()) as QueuedSyncChange[];
  } finally {
    database.close();
  }
}

export async function acceptAppliedSync(envelopes: SyncEnvelope[], sentChanges: ReadonlyMap<string, string> = new Map()): Promise<void> {
  if (!envelopes.length) return;
  const database = await openDatabase();
  try {
    const transaction = database.transaction([queueStore, metadataStore, conflictStore], "readwrite");
    for (const envelope of envelopes) {
      const key = syncKey(envelope.type, envelope.id);
      const acknowledgedMutationId = sentChanges.get(key);
      if (acknowledgedMutationId) {
        const request = transaction.objectStore(queueStore).get(key);
        request.onsuccess = () => {
          const current = request.result as QueuedSyncChange | undefined;
          if (current?.mutationId === acknowledgedMutationId) transaction.objectStore(queueStore).delete(key);
          else if (current) transaction.objectStore(queueStore).put({ ...current, expectedRevision: envelope.revision });
        };
      } else transaction.objectStore(queueStore).delete(key);
      transaction.objectStore(conflictStore).delete(key);
      transaction.objectStore(metadataStore).put({ key, revision: envelope.revision, updatedAt: envelope.updatedAt } satisfies SyncMetadata);
    }
    await transactionComplete(transaction);
  } finally {
    database.close();
  }
}

export async function saveSyncConflicts(conflicts: SyncConflict[]): Promise<void> {
  if (!conflicts.length) return;
  const database = await openDatabase();
  try {
    const transaction = database.transaction(conflictStore, "readwrite");
    conflicts.forEach((conflict) => transaction.objectStore(conflictStore).put(conflict));
    await transactionComplete(transaction);
  } finally {
    database.close();
  }
}

export async function listSyncConflicts(): Promise<SyncConflict[]> {
  const database = await openDatabase();
  try {
    return await requestResult(database.transaction(conflictStore, "readonly").objectStore(conflictStore).getAll()) as SyncConflict[];
  } finally {
    database.close();
  }
}

export async function removeSyncConflict(key: string): Promise<void> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(conflictStore, "readwrite");
    transaction.objectStore(conflictStore).delete(key);
    await transactionComplete(transaction);
  } finally {
    database.close();
  }
}

export async function resetSyncTracking(): Promise<void> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction([queueStore, metadataStore, conflictStore], "readwrite");
    transaction.objectStore(queueStore).clear();
    transaction.objectStore(metadataStore).clear();
    transaction.objectStore(conflictStore).clear();
    await transactionComplete(transaction);
    localStorage.removeItem("soulforge.sync.cursor");
  } finally {
    database.close();
  }
}

export async function setRemoteMetadata(envelope: SyncEnvelope): Promise<void> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(metadataStore, "readwrite");
    transaction.objectStore(metadataStore).put({ key: syncKey(envelope.type, envelope.id), revision: envelope.revision, updatedAt: envelope.updatedAt } satisfies SyncMetadata);
    await transactionComplete(transaction);
  } finally {
    database.close();
  }
}

export function loadSyncCursor(): number {
  return Number(localStorage.getItem("soulforge.sync.cursor") ?? "0") || 0;
}

export function saveSyncCursor(cursor: number): void {
  localStorage.setItem("soulforge.sync.cursor", String(cursor));
}

function transactionComplete(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}
