import type { Character, Definition, PackManifest } from "../domain/types";
import type { CardMarkerOverride } from "./compendiumRepository";
import { ensureSyncStores } from "./syncRepository";

const databaseName = "soulforge";
const databaseVersion = 5;
const storeNames = ["characters", "installedPacks", "customDefinitions", "definitionOverrides"] as const;

export type LocalDataSnapshot = {
  characters: Character[];
  installedPacks: PackManifest[];
  definitions: Definition[];
  overrides: CardMarkerOverride[];
};

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, databaseVersion);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains("characters")) database.createObjectStore("characters", { keyPath: "id" });
      if (!database.objectStoreNames.contains("installedPacks")) database.createObjectStore("installedPacks", { keyPath: "id" });
      if (!database.objectStoreNames.contains("customDefinitions")) database.createObjectStore("customDefinitions", { keyPath: "id" });
      if (!database.objectStoreNames.contains("definitionOverrides")) database.createObjectStore("definitionOverrides", { keyPath: "id" });
      ensureSyncStores(database);
    };
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

/** Lê as quatro coleções persistidas para criar um backup coerente. */
export async function loadLocalDataSnapshot(): Promise<LocalDataSnapshot> {
  const database = await openDatabase();
  try {
    return await new Promise<LocalDataSnapshot>((resolve, reject) => {
      const transaction = database.transaction(storeNames, "readonly");
      const characters = transaction.objectStore("characters").getAll();
      const installedPacks = transaction.objectStore("installedPacks").getAll();
      const definitions = transaction.objectStore("customDefinitions").getAll();
      const overrides = transaction.objectStore("definitionOverrides").getAll();
      transaction.oncomplete = () => resolve({
        characters: characters.result as Character[],
        installedPacks: installedPacks.result as PackManifest[],
        definitions: definitions.result as Definition[],
        overrides: (overrides.result as CardMarkerOverride[]).filter((entry) => entry.kind === "card-marker")
      });
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  } finally {
    database.close();
  }
}

/** Substitui o estado local inteiro sem expor transações IndexedDB à interface. */
export async function replaceLocalDataSnapshot(snapshot: LocalDataSnapshot): Promise<void> {
  const database = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(storeNames, "readwrite");
      storeNames.forEach((name) => transaction.objectStore(name).clear());
      snapshot.characters.forEach((character) => transaction.objectStore("characters").put(character));
      snapshot.installedPacks.forEach((pack) => transaction.objectStore("installedPacks").put(pack));
      snapshot.definitions.forEach((definition) => transaction.objectStore("customDefinitions").put(definition));
      snapshot.overrides.forEach((override) => transaction.objectStore("definitionOverrides").put(override));
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  } finally {
    database.close();
  }
}

/** Mescla somente autoria local e complementos, preservando Packs e fichas. */
export async function mergeLocalContent(definitions: Definition[], overrides: CardMarkerOverride[]): Promise<void> {
  const database = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(["customDefinitions", "definitionOverrides"], "readwrite");
      definitions.forEach((definition) => transaction.objectStore("customDefinitions").put(definition));
      overrides.forEach((override) => transaction.objectStore("definitionOverrides").put(override));
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  } finally {
    database.close();
  }
}
