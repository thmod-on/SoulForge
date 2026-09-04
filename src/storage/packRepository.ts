import type { Definition, PackManifest } from "../domain/types";

const databaseName = "soulforge";
const databaseVersion = 4;
const packStoreName = "installedPacks";
const definitionStoreName = "customDefinitions";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, databaseVersion);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains("characters")) database.createObjectStore("characters", { keyPath: "id" });
      if (!database.objectStoreNames.contains(definitionStoreName)) database.createObjectStore(definitionStoreName, { keyPath: "id" });
      if (!database.objectStoreNames.contains(packStoreName)) database.createObjectStore(packStoreName, { keyPath: "id" });
      if (!database.objectStoreNames.contains("definitionOverrides")) database.createObjectStore("definitionOverrides", { keyPath: "id" });
    };
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

export async function loadInstalledPacks(): Promise<PackManifest[]> {
  const database = await openDatabase();
  const packs = await new Promise<PackManifest[]>((resolve, reject) => {
    const request = database.transaction(packStoreName, "readonly").objectStore(packStoreName).getAll();
    request.onsuccess = () => resolve(request.result as PackManifest[]);
    request.onerror = () => reject(request.error);
  });
  database.close();
  return packs;
}

export async function installLocalPack(manifest: PackManifest, definitions: Definition[]): Promise<void> {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction([packStoreName, definitionStoreName], "readwrite");
    // A importação de uma versão mais nova do mesmo Pack deve substituir
    // somente o conteúdo daquele Pack, preservando fichas, overrides e
    // Definitions locais que não pertencem a ele.
    transaction.objectStore(packStoreName).put(manifest);
    const definitionsStore = transaction.objectStore(definitionStoreName);
    const incomingIds = new Set(definitions.map((definition) => definition.id));
    const cursorRequest = definitionsStore.openCursor();
    cursorRequest.onsuccess = () => {
      const cursor = cursorRequest.result;
      if (!cursor) return;
      const definition = cursor.value as Definition;
      if (definition.packId === manifest.id && !incomingIds.has(definition.id)) cursor.delete();
      cursor.continue();
    };
    definitions.forEach((definition) => definitionsStore.put(definition));
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
  database.close();
}

export async function removeLocalPack(packId: string): Promise<void> {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction([packStoreName, definitionStoreName], "readwrite");
    transaction.objectStore(packStoreName).delete(packId);
    const definitionsStore = transaction.objectStore(definitionStoreName);
    const cursorRequest = definitionsStore.openCursor();
    cursorRequest.onsuccess = () => {
      const cursor = cursorRequest.result;
      if (!cursor) return;
      const definition = cursor.value as Definition;
      if (definition.packId === packId) cursor.delete();
      cursor.continue();
    };
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
  database.close();
}
