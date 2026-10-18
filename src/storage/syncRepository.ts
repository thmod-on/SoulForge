import type { SyncConflict, SyncEnvelope, SyncPushChange, SyncResourceType } from "../sync/types";
import { syncKey } from "../sync/types";
import type { Character, Definition } from "../domain/types";
import type { CardMarkerOverride } from "./compendiumRepository";

const databaseName = "soulforge";
const databaseVersion = 6;
const queueStore = "syncQueue";
const metadataStore = "syncMetadata";
const conflictStore = "syncConflicts";
const controlStore = "syncControl";
const snapshotStore = "syncSnapshot";

export function ensureSyncStores(database: IDBDatabase): void {
  if (!database.objectStoreNames.contains(queueStore)) database.createObjectStore(queueStore, { keyPath: "key" });
  if (!database.objectStoreNames.contains(metadataStore)) database.createObjectStore(metadataStore, { keyPath: "key" });
  if (!database.objectStoreNames.contains(conflictStore)) database.createObjectStore(conflictStore, { keyPath: "key" });
  if (!database.objectStoreNames.contains(controlStore)) database.createObjectStore(controlStore, { keyPath: "key" });
  if (!database.objectStoreNames.contains(snapshotStore)) database.createObjectStore(snapshotStore, { keyPath: "key" });
}

export type QueuedSyncChange = SyncPushChange & { key: string; queuedAt: string };
export type SyncMetadata = { key: string; revision: number; updatedAt: string };
export type SyncIdentity = { deviceId: string; cursor: number };
type SyncControl = SyncIdentity & { key: "control"; snapshotId?: string; snapshotBaseline?: number };
type StagedEnvelope = SyncEnvelope & { key: string };

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
    const transaction = database.transaction([queueStore, metadataStore, conflictStore, snapshotStore, controlStore], "readwrite");
    transaction.objectStore(queueStore).clear();
    transaction.objectStore(metadataStore).clear();
    transaction.objectStore(conflictStore).clear();
    transaction.objectStore(snapshotStore).clear();
    const control = await requestResult(transaction.objectStore(controlStore).get("control")) as SyncControl | undefined;
    if (control) transaction.objectStore(controlStore).put({ key: "control", deviceId: control.deviceId, cursor: 0 } satisfies SyncControl);
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

export async function beginSyncSnapshot(snapshotId: string, baselineCursor: number): Promise<void> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction([snapshotStore, controlStore], "readwrite");
    transaction.objectStore(snapshotStore).clear();
    const control = await requestResult(transaction.objectStore(controlStore).get("control")) as SyncControl | undefined;
    transaction.objectStore(controlStore).put({ key: "control", deviceId: control?.deviceId ?? crypto.randomUUID(), cursor: control?.cursor ?? 0, snapshotId, snapshotBaseline: baselineCursor } satisfies SyncControl);
    await transactionComplete(transaction);
  } finally {
    database.close();
  }
}

export async function stageSyncSnapshot(envelopes: SyncEnvelope[]): Promise<void> {
  if (!envelopes.length) return;
  const database = await openDatabase();
  try {
    const transaction = database.transaction(snapshotStore, "readwrite");
    for (const envelope of envelopes) transaction.objectStore(snapshotStore).put({ ...envelope, key: syncKey(envelope.type, envelope.id) } satisfies StagedEnvelope);
    await transactionComplete(transaction);
  } finally {
    database.close();
  }
}

export async function applyRemoteSyncPage(envelopes: SyncEnvelope[], cursor: number): Promise<{ changed: boolean }> {
  const database = await openDatabase();
  try {
    const read = database.transaction([queueStore, conflictStore, metadataStore], "readonly");
    const [queued, conflicts, metadata] = await Promise.all([
      requestResult(read.objectStore(queueStore).getAll()) as Promise<QueuedSyncChange[]>,
      requestResult(read.objectStore(conflictStore).getAll()) as Promise<SyncConflict[]>,
      requestResult(read.objectStore(metadataStore).getAll()) as Promise<SyncMetadata[]>
    ]);
    await transactionComplete(read);
    const blocked = new Set([...queued.map((entry) => entry.key), ...conflicts.map((entry) => entry.key)]);
    const metadataByKey = new Map(metadata.map((entry) => [entry.key, entry]));
    const write = database.transaction([metadataStore, controlStore, "characters", "customDefinitions", "definitionOverrides"], "readwrite");
    let changed = false;
    for (const envelope of envelopes) {
      const key = syncKey(envelope.type, envelope.id);
      if (blocked.has(key) || (metadataByKey.get(key)?.revision ?? -1) >= envelope.revision) continue;
      if (envelope.deletedAt) write.objectStore(resourceStore(envelope.type)).delete(envelope.id);
      else write.objectStore(resourceStore(envelope.type)).put(envelope.payload);
      write.objectStore(metadataStore).put({ key, revision: envelope.revision, updatedAt: envelope.updatedAt } satisfies SyncMetadata);
      changed = true;
    }
    const control = await requestResult(write.objectStore(controlStore).get("control")) as SyncControl | undefined;
    write.objectStore(controlStore).put({ key: "control", deviceId: control?.deviceId ?? crypto.randomUUID(), cursor } satisfies SyncControl);
    await transactionComplete(write);
    return { changed };
  } finally {
    database.close();
  }
}

export async function commitSyncSnapshot(baselineCursor: number): Promise<{ changed: boolean }> {
  const database = await openDatabase();
  try {
    const read = database.transaction([snapshotStore, queueStore, metadataStore, conflictStore, "characters", "customDefinitions", "definitionOverrides"], "readonly");
    const [staged, queued, metadata, conflicts, characters, definitions, overrides] = await Promise.all([
      requestResult(read.objectStore(snapshotStore).getAll()) as Promise<StagedEnvelope[]>,
      requestResult(read.objectStore(queueStore).getAll()) as Promise<QueuedSyncChange[]>,
      requestResult(read.objectStore(metadataStore).getAll()) as Promise<SyncMetadata[]>,
      requestResult(read.objectStore(conflictStore).getAll()) as Promise<SyncConflict[]>,
      requestResult(read.objectStore("characters").getAll()) as Promise<Character[]>,
      requestResult(read.objectStore("customDefinitions").getAll()) as Promise<Definition[]>,
      requestResult(read.objectStore("definitionOverrides").getAll()) as Promise<CardMarkerOverride[]>
    ]);
    await transactionComplete(read);
    const stagedByKey = new Map(staged.map((entry) => [entry.key, entry]));
    const queuedByKey = new Map(queued.map((entry) => [entry.key, entry]));
    const metadataByKey = new Map(metadata.map((entry) => [entry.key, entry]));
    const conflictKeys = new Set(conflicts.map((entry) => entry.key));
    const localEntries: Array<{ type: SyncResourceType; id: string; value: unknown }> = [
      ...characters.map((value) => ({ type: "character" as const, id: value.id, value })),
      ...definitions.filter((value) => value.packId === "local").map((value) => ({ type: "definition" as const, id: value.id, value })),
      ...overrides.map((value) => ({ type: "override" as const, id: value.id, value }))
    ];
    const write = database.transaction([snapshotStore, queueStore, metadataStore, conflictStore, controlStore, "characters", "customDefinitions", "definitionOverrides"], "readwrite");
    let changed = false;
    for (const local of localEntries) {
      const key = syncKey(local.type, local.id);
      if (stagedByKey.has(key) || conflictKeys.has(key)) continue;
      const pending = queuedByKey.get(key);
      if (pending) {
        if (pending.expectedRevision > 0) {
          write.objectStore(conflictStore).put({ key, local: pending, remote: { type: local.type, id: local.id, revision: 0, updatedAt: new Date().toISOString(), deletedAt: new Date().toISOString() } } satisfies SyncConflict);
        }
        continue;
      }
      if (!metadataByKey.has(key)) continue;
      write.objectStore(resourceStore(local.type)).delete(local.id);
      write.objectStore(metadataStore).delete(key);
      changed = true;
    }
    for (const envelope of staged) {
      if (queuedByKey.has(envelope.key) || conflictKeys.has(envelope.key)) continue;
      if ((metadataByKey.get(envelope.key)?.revision ?? -1) >= envelope.revision) continue;
      if (envelope.deletedAt) write.objectStore(resourceStore(envelope.type)).delete(envelope.id);
      else write.objectStore(resourceStore(envelope.type)).put(envelope.payload);
      write.objectStore(metadataStore).put({ key: envelope.key, revision: envelope.revision, updatedAt: envelope.updatedAt } satisfies SyncMetadata);
      changed = true;
    }
    const control = await requestResult(write.objectStore(controlStore).get("control")) as SyncControl | undefined;
    write.objectStore(controlStore).put({ key: "control", deviceId: control?.deviceId ?? crypto.randomUUID(), cursor: baselineCursor } satisfies SyncControl);
    write.objectStore(snapshotStore).clear();
    await transactionComplete(write);
    return { changed };
  } finally {
    database.close();
  }
}

function resourceStore(type: SyncResourceType): string {
  if (type === "character") return "characters";
  if (type === "definition") return "customDefinitions";
  return "definitionOverrides";
}

export async function loadSyncIdentity(): Promise<SyncIdentity> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(controlStore, "readwrite");
    const store = transaction.objectStore(controlStore);
    let control = await requestResult(store.get("control")) as SyncControl | undefined;
    if (!control) {
      control = { key: "control", deviceId: crypto.randomUUID(), cursor: legacyCursor() };
      store.put(control);
    }
    await transactionComplete(transaction);
    localStorage.removeItem("soulforge.sync.cursor");
    return { deviceId: control.deviceId, cursor: control.cursor };
  } finally {
    database.close();
  }
}

export async function saveSyncCursor(cursor: number): Promise<void> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(controlStore, "readwrite");
    const store = transaction.objectStore(controlStore);
    const current = await requestResult(store.get("control")) as SyncControl | undefined;
    store.put({ key: "control", deviceId: current?.deviceId ?? crypto.randomUUID(), cursor } satisfies SyncControl);
    await transactionComplete(transaction);
  } finally {
    database.close();
  }
}

export async function loadSyncCursor(): Promise<number> {
  return (await loadSyncIdentity()).cursor;
}

function legacyCursor(): number {
  const value = Number(localStorage.getItem("soulforge.sync.cursor") ?? "0");
  return Number.isSafeInteger(value) && value >= 0 ? value : 0;
}

function transactionComplete(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}
