import type { Definition, GameMarkerDefinition } from "../domain/types";
import { normalizeCardMarkerOverride, normalizeDefinitionRestTimings } from "../domain/restTimingMigration";
import { ensureSyncStores } from "./syncRepository";

const databaseName = "soulforge";
const storeName = "customDefinitions";
const overrideStoreName = "definitionOverrides";
const databaseVersion = 5;

/** Complemento local de metadados para conteudo de packs, sem alterar a fonte original. */
export type CardMarkerOverride = {
  id: string;
  kind: "card-marker";
  definitionId: string;
  gameMarkers: GameMarkerDefinition[];
};

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, databaseVersion);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains("characters")) {
        database.createObjectStore("characters", { keyPath: "id" });
      }
      if (!database.objectStoreNames.contains(storeName)) {
        database.createObjectStore(storeName, { keyPath: "id" });
      }
      if (!database.objectStoreNames.contains("installedPacks")) {
        database.createObjectStore("installedPacks", { keyPath: "id" });
      }
      if (!database.objectStoreNames.contains(overrideStoreName)) {
        database.createObjectStore(overrideStoreName, { keyPath: "id" });
      }
      ensureSyncStores(database);
    };
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

export async function loadCardMarkerOverrides(): Promise<CardMarkerOverride[]> {
  const database = await openDatabase();
  const overrides = await new Promise<CardMarkerOverride[]>((resolve, reject) => {
    const request = database.transaction(overrideStoreName, "readonly").objectStore(overrideStoreName).getAll();
    request.onsuccess = () => resolve((request.result as CardMarkerOverride[]).filter((entry) => entry.kind === "card-marker"));
    request.onerror = () => reject(request.error);
  });
  database.close();
  return overrides;
}

export async function saveCardMarkerOverride(definitionId: string, gameMarkers: GameMarkerDefinition[]): Promise<void> {
  return putCardMarkerOverride({ id: `card-marker:${definitionId}`, kind: "card-marker", definitionId, gameMarkers });
}

export async function putCardMarkerOverride(override: CardMarkerOverride): Promise<void> {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(overrideStoreName, "readwrite");
    transaction.objectStore(overrideStoreName).put(override);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
}

export async function deleteCardMarkerOverride(overrideId: string): Promise<void> {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(overrideStoreName, "readwrite");
    transaction.objectStore(overrideStoreName).delete(overrideId);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
}

export async function loadCustomDefinitions(): Promise<Definition[]> {
  const database = await openDatabase();
  const definitions = await new Promise<Definition[]>((resolve, reject) => {
    const transaction = database.transaction(storeName, "readonly");
    const request = transaction.objectStore(storeName).getAll();
    request.onsuccess = () => resolve(request.result as Definition[]);
    request.onerror = () => reject(request.error);
  });
  database.close();
  return definitions;
}

export async function saveCustomDefinition(definition: Definition): Promise<void> {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(storeName, "readwrite");
    transaction.objectStore(storeName).put(definition);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
}

export async function deleteCustomDefinition(definitionId: string): Promise<void> {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(storeName, "readwrite");
    transaction.objectStore(storeName).delete(definitionId);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
}

/** Persiste a semântica atual de descanso para conteúdo local e Packs já instalados. */
export async function migrateLegacyRestTimings(): Promise<void> {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction([storeName, overrideStoreName], "readwrite");
    const definitions = transaction.objectStore(storeName);
    const overrides = transaction.objectStore(overrideStoreName);
    const definitionsRequest = definitions.getAll();
    definitionsRequest.onerror = () => reject(definitionsRequest.error);
    definitionsRequest.onsuccess = () => {
      for (const definition of definitionsRequest.result as Definition[]) {
        const normalized = normalizeDefinitionRestTimings(definition);
        if (normalized !== definition) definitions.put(normalized);
      }
    };
    const overridesRequest = overrides.getAll();
    overridesRequest.onerror = () => reject(overridesRequest.error);
    overridesRequest.onsuccess = () => {
      for (const override of overridesRequest.result as CardMarkerOverride[]) {
        const normalized = normalizeCardMarkerOverride(override);
        if (normalized !== override) overrides.put(normalized);
      }
    };
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
  database.close();
}
