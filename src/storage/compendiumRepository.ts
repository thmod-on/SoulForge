import type { Definition, GameMarkerDefinition, ItemCombatModifiers, ItemDefinition, ItemDerivedDefenseModifier } from "../domain/types";
import { normalizeCardMarkerOverride, normalizeDefinitionRestTimings } from "../domain/restTimingMigration";
import { ensureSyncStores } from "./syncRepository";

const databaseName = "soulforge";
const storeName = "customDefinitions";
const overrideStoreName = "definitionOverrides";
const databaseVersion = 6;

/** Complemento local de metadados para conteudo de packs, sem alterar a fonte original. */
export type CardMarkerOverride = {
  id: string;
  kind: "card-marker";
  definitionId: string;
  gameMarkers: GameMarkerDefinition[];
};

export type ItemOverrideValues = {
  summary?: string;
  image?: string | null;
  combatModifiers?: ItemCombatModifiers | null;
  derivedDefenseModifiers?: ItemDerivedDefenseModifier[] | null;
  armorProfile?: ItemDefinition["armorProfile"] | null;
};

export type ItemPersonalOverride = {
  id: string;
  kind: "item-personal";
  definitionId: string;
  sourcePackVersion: string;
  changes: ItemOverrideValues;
  baseline: ItemOverrideValues;
  updatedAt: string;
};

export type DefinitionOverride = CardMarkerOverride | ItemPersonalOverride;

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
  return (await loadDefinitionOverrides()).filter((entry): entry is CardMarkerOverride => entry.kind === "card-marker");
}

export async function loadDefinitionOverrides(): Promise<DefinitionOverride[]> {
  const database = await openDatabase();
  const overrides = await new Promise<DefinitionOverride[]>((resolve, reject) => {
    const request = database.transaction(overrideStoreName, "readonly").objectStore(overrideStoreName).getAll();
    request.onsuccess = () => resolve((request.result as DefinitionOverride[]).filter(isDefinitionOverride));
    request.onerror = () => reject(request.error);
  });
  database.close();
  return overrides;
}

export async function saveCardMarkerOverride(definitionId: string, gameMarkers: GameMarkerDefinition[]): Promise<void> {
  return putCardMarkerOverride({ id: `card-marker:${definitionId}`, kind: "card-marker", definitionId, gameMarkers });
}

export async function putCardMarkerOverride(override: CardMarkerOverride): Promise<void> {
  return putDefinitionOverride(override);
}

export async function putDefinitionOverride(override: DefinitionOverride): Promise<void> {
  if (!isDefinitionOverride(override)) throw new Error("Complemento de Definition inválido.");
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
  return deleteDefinitionOverride(overrideId);
}

export async function deleteDefinitionOverride(overrideId: string): Promise<void> {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(overrideStoreName, "readwrite");
    transaction.objectStore(overrideStoreName).delete(overrideId);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
}

export function isDefinitionOverride(value: unknown): value is DefinitionOverride {
  if (!value || typeof value !== "object") return false;
  const entry = value as Partial<DefinitionOverride>;
  if (typeof entry.id !== "string" || typeof entry.definitionId !== "string") return false;
  if (entry.kind === "card-marker") return entry.id === `card-marker:${entry.definitionId}` && Array.isArray(entry.gameMarkers);
  if (entry.kind !== "item-personal" || entry.id !== `item-personal:${entry.definitionId}` || typeof entry.sourcePackVersion !== "string" || typeof entry.updatedAt !== "string") return false;
  return isItemOverrideValues(entry.changes) && isItemOverrideValues(entry.baseline);
}

function isItemOverrideValues(value: unknown): value is ItemOverrideValues {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const entry = value as ItemOverrideValues;
  if (entry.summary !== undefined && typeof entry.summary !== "string") return false;
  if (entry.image !== undefined && entry.image !== null && typeof entry.image !== "string") return false;
  if (entry.combatModifiers !== undefined && entry.combatModifiers !== null && (typeof entry.combatModifiers !== "object" || Object.entries(entry.combatModifiers).some(([key, amount]) => !["armor", "evasion", "minor", "major"].includes(key) || !Number.isFinite(amount)))) return false;
  if (entry.armorProfile !== undefined && entry.armorProfile !== null && (!Number.isFinite(entry.armorProfile.armor) || !Number.isFinite(entry.armorProfile.minorThreshold) || !Number.isFinite(entry.armorProfile.majorThreshold))) return false;
  return entry.derivedDefenseModifiers === undefined || entry.derivedDefenseModifiers === null || Array.isArray(entry.derivedDefenseModifiers) && entry.derivedDefenseModifiers.every((modifier) => {
    if (!modifier || !["armor", "evasion", "minor", "major"].includes(modifier.field) || !modifier.source) return false;
    if (modifier.multiplier !== undefined && !Number.isFinite(modifier.multiplier)) return false;
    if (modifier.divisor !== undefined && (!Number.isFinite(modifier.divisor) || modifier.divisor <= 0)) return false;
    if (modifier.rounding !== undefined && !["ceil", "floor", "round"].includes(modifier.rounding)) return false;
    return modifier.source.kind === "attribute" ? ["for", "dex", "con", "int", "wil", "cha"].includes(modifier.source.attributeId) : ["spellcast-attribute", "character-level", "character-tier"].includes(modifier.source.kind);
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
      for (const override of overridesRequest.result as DefinitionOverride[]) {
        if (override.kind !== "card-marker") continue;
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
