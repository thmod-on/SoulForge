import { demoCharacter } from "../domain/demoCharacter";
import type { Character } from "../domain/types";

const databaseName = "soulforge";
const storeName = "characters";
const databaseVersion = 2;

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, databaseVersion);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(storeName)) {
        database.createObjectStore(storeName, { keyPath: "id" });
      }
      if (!database.objectStoreNames.contains("customDefinitions")) {
        database.createObjectStore("customDefinitions", { keyPath: "id" });
      }
    };

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

export async function saveCharacter(character: Character): Promise<void> {
  const database = await openDatabase();

  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(storeName, "readwrite");
    transaction.objectStore(storeName).put(character);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });

  database.close();
}

export async function loadCharacter(characterId: string): Promise<Character | undefined> {
  const database = await openDatabase();

  const character = await new Promise<Character | undefined>((resolve, reject) => {
    const transaction = database.transaction(storeName, "readonly");
    const request = transaction.objectStore(storeName).get(characterId);

    request.onsuccess = () => resolve(request.result as Character | undefined);
    request.onerror = () => reject(request.error);
  });

  database.close();
  return character;
}

export async function ensureDemoCharacter(): Promise<Character> {
  const existingCharacter = await loadCharacter(demoCharacter.id);

  if (existingCharacter) {
    const migratedCharacter = migrateDemoCharacter(existingCharacter);
    await saveCharacter(migratedCharacter);
    return migratedCharacter;
  }

  await saveCharacter(demoCharacter);
  return demoCharacter;
}

function migrateDemoCharacter(character: Character): Character {
  const compartments = character.inventory.compartments ?? demoCharacter.inventory.compartments;
  const entries = character.inventory.entries.map((entry) => ({
    ...entry,
    compartmentId: entry.compartmentId ?? (entry.equipped ? "equipped" : "backpack")
  }));

  return {
    ...character,
    attributes: demoCharacter.attributes,
    resources: demoCharacter.resources,
    skills: character.skills ?? demoCharacter.skills,
    experiences: character.experiences ?? demoCharacter.experiences,
    notes: character.notes ?? demoCharacter.notes,
    deck: {
      ...character.deck,
      learnedCardIds: character.deck.learnedCardIds ?? demoCharacter.deck.learnedCardIds
    },
    inventory: {
      ...character.inventory,
      capacity: character.inventory.capacity ?? demoCharacter.inventory.capacity,
      compartments,
      entries
    }
  };
}
