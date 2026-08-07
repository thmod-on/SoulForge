import type { Catalog } from "../../domain/catalog";
import type { CardDefinition, Character, CharacterGameMarkerState, ClassDefinition, FeatureDefinition, GameMarkerDefinition } from "../../domain/types";

export type ActiveGameMarker = { key: string; sourceDefinitionId: string; sourceLabel: string; definition: GameMarkerDefinition; state: CharacterGameMarkerState };
type MarkerSource = { definition: CardDefinition | ClassDefinition | FeatureDefinition; label: string };

/** Sincroniza presenca e estado inicial. Fontes inativas permanecem persistidas, mas nao sao exibidas. */
export function synchronizeGameMarkers(character: Character, catalog: Catalog): Character {
  const previous = character.gameMarkers ?? [];
  const states = new Map(previous.map((state) => [state.key, state]));
  let changed = !character.gameMarkers;
  for (const source of getActiveMarkerSources(character, catalog)) for (const definition of source.definition.gameMarkers ?? []) {
    const key = getGameMarkerKey(source.definition.id, definition.id);
    const next = synchronizeMarkerState(states.get(key), key, source.definition.id, definition, character, catalog);
    if (JSON.stringify(states.get(key)) !== JSON.stringify(next)) { states.set(key, next); changed = true; }
  }
  return changed ? { ...character, gameMarkers: [...states.values()] } : character;
}

export function getActiveGameMarkers(character: Character, catalog: Catalog): ActiveGameMarker[] {
  const stateByKey = new Map((character.gameMarkers ?? []).map((state) => [state.key, state]));
  return getActiveMarkerSources(character, catalog).flatMap((source) => (source.definition.gameMarkers ?? []).flatMap((definition) => {
    const key = getGameMarkerKey(source.definition.id, definition.id); const state = stateByKey.get(key);
    return state ? [{ key, sourceDefinitionId: source.definition.id, sourceLabel: source.label, definition, state }] : [];
  }));
}

/** Aplica somente a reinicializacao declarada para o evento recebido. */
export function resetGameMarkers(character: Character, catalog: Catalog, reset: "session" | "short-rest" | "long-rest"): Character {
  const markerByKey = new Map(getActiveGameMarkers(character, catalog).map((marker) => [marker.key, marker]));
  let changed = false;
  const gameMarkers = (character.gameMarkers ?? []).map((state) => {
    const active = markerByKey.get(state.key);
    if (!active || active.definition.reset !== reset) return state;
    changed = true;
    if (state.kind === "counter" && active.definition.kind === "counter") {
      const value = active.definition.initialValue ?? 0;
      return { ...state, value: state.max === undefined ? value : Math.min(value, state.max) };
    }
    if (state.kind === "dice") return { ...state, results: state.results.map((die) => ({ ...die, value: 0, used: false })) };
    return state;
  });
  return changed ? { ...character, gameMarkers } : character;
}

export function getGameMarkerKey(sourceDefinitionId: string, markerId: string): string { return `${sourceDefinitionId}:${markerId}`; }

function getActiveMarkerSources(character: Character, catalog: Catalog): MarkerSource[] {
  const sources: MarkerSource[] = [];
  const classDefinition = character.identity.primaryClassId ? catalog.classes.find((entry) => entry.id === character.identity.primaryClassId) : undefined;
  if (classDefinition) {
    sources.push({ definition: classDefinition, label: classDefinition.name });
    for (const featureId of [...classDefinition.featureIds, classDefinition.hopeFeatureId]) {
      const feature = catalog.features.find((entry) => entry.id === featureId); if (feature) sources.push({ definition: feature, label: feature.name });
    }
  }
  const subclass = character.identity.primarySubclassId ? catalog.subclasses.find((entry) => entry.id === character.identity.primarySubclassId) : undefined;
  if (subclass) {
    const acquired = new Set(character.progression?.acquiredSubclassTiers ?? ["foundation"]);
    const featureIds = [...subclass.foundationFeatureIds, ...(acquired.has("specialized") ? subclass.specializationFeatureIds : []), ...(acquired.has("mastery") ? subclass.masteryFeatureIds : [])];
    for (const featureId of featureIds) { const feature = catalog.features.find((entry) => entry.id === featureId); if (feature) sources.push({ definition: feature, label: feature.name }); }
  }
  for (const cardId of character.deck.activeCardIds) { const card = catalog.cards.find((entry) => entry.id === cardId); if (card) sources.push({ definition: card, label: card.name }); }
  return sources;
}

function synchronizeMarkerState(existing: CharacterGameMarkerState | undefined, key: string, sourceDefinitionId: string, definition: GameMarkerDefinition, character: Character, catalog: Catalog): CharacterGameMarkerState {
  if (definition.kind === "counter") {
    const max = definition.max;
    if (existing?.kind === "counter") return { ...existing, key, sourceDefinitionId, markerId: definition.id, max, value: max === undefined ? existing.value : Math.min(existing.value, max) };
    const value = definition.initialValue ?? 0;
    return { key, sourceDefinitionId, markerId: definition.id, kind: "counter", value: max === undefined ? value : Math.min(value, max), ...(max === undefined ? {} : { max }) };
  }
  const quantity = getDiceQuantity(definition, character, catalog, sourceDefinitionId);
  if (existing?.kind === "dice" && existing.die === definition.die) {
    const results = existing.results.slice(0, quantity); while (results.length < quantity) results.push(createDieResult(key, results.length));
    return { ...existing, key, sourceDefinitionId, markerId: definition.id, results };
  }
  return { key, sourceDefinitionId, markerId: definition.id, kind: "dice", die: definition.die, results: Array.from({ length: quantity }, (_, index) => createDieResult(key, index)) };
}

function getDiceQuantity(definition: Extract<GameMarkerDefinition, { kind: "dice" }>, character: Character, catalog: Catalog, sourceDefinitionId: string): number {
  const quantity = definition.quantity;
  if (quantity.kind === "fixed") return Math.max(0, quantity.value);
  if (quantity.kind === "attribute") return Math.max(0, character.attributes.find((attribute) => attribute.id === quantity.attributeId)?.value ?? 0);
  const feature = catalog.features.find((entry) => entry.id === sourceDefinitionId);
  const subclass = feature?.sourceType === "subclass" ? catalog.subclasses.find((entry) => entry.id === feature.sourceId) : character.identity.primarySubclassId ? catalog.subclasses.find((entry) => entry.id === character.identity.primarySubclassId) : undefined;
  const attributeId = subclass?.spellcastAttributeId;
  return Math.max(0, character.attributes.find((attribute) => attribute.id === attributeId)?.value ?? 0);
}

function createDieResult(key: string, index: number) { return { id: `${key}:die:${index}`, value: 0, used: false }; }
