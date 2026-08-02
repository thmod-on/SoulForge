import type { Definition } from "../domain/types";

const databaseName = "soulforge";
const storeName = "customDefinitions";
const databaseVersion = 3;

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
    };
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
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
