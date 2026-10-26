import type { Catalog } from "../../domain/catalog";
import type { Character, PackBundle } from "../../domain/types";

export type PackUsageReference = { characterId: string; characterName: string; packId: string; definitionId: string; definitionName: string; kind: string };
export type PackUsageImpact = { removedDefinitionIds: string[]; changedDefinitionIds: string[]; references: PackUsageReference[] };

export function analyzePackRemoval(characters: Character[], catalog: Catalog, packIds: string[]): PackUsageImpact {
  const removed = catalog.definitions.filter((definition) => packIds.includes(definition.packId));
  return analyzeReferences(characters, catalog, removed.map((definition) => definition.id), []);
}

export function analyzePackUpdate(characters: Character[], catalog: Catalog, bundles: PackBundle[]): PackUsageImpact {
  const byPack = new Map(bundles.map((bundle) => [bundle.manifest.id, bundle]));
  const current = catalog.definitions.filter((definition) => byPack.has(definition.packId));
  const incoming = new Map(bundles.flatMap((bundle) => bundle.definitions.map((definition) => [definition.id, definition] as const)));
  const removed = current.filter((definition) => !incoming.has(definition.id)).map((definition) => definition.id);
  const changed = current.filter((definition) => {
    const next = incoming.get(definition.id);
    return next && JSON.stringify(definition) !== JSON.stringify(next);
  }).map((definition) => definition.id);
  return analyzeReferences(characters, catalog, removed, changed);
}

export function hasPackUsageImpact(impact: PackUsageImpact | undefined): boolean {
  return Boolean(impact?.references.length);
}

function analyzeReferences(characters: Character[], catalog: Catalog, removedDefinitionIds: string[], changedDefinitionIds: string[]): PackUsageImpact {
  const affected = new Set(removedDefinitionIds);
  const definitions = new Map(catalog.definitions.map((definition) => [definition.id, definition]));
  const references = characters.flatMap((character) => collectCharacterReferences(character).flatMap(({ definitionId, kind }) => {
    if (!affected.has(definitionId)) return [];
    const definition = definitions.get(definitionId);
    return [{ characterId: character.id, characterName: character.identity.name || "Personagem sem nome", packId: definition?.packId ?? "indisponível", definitionId, definitionName: definition?.name ?? definitionId, kind }];
  }));
  return { removedDefinitionIds, changedDefinitionIds, references: deduplicate(references) };
}

function collectCharacterReferences(character: Character): Array<{ definitionId: string; kind: string }> {
  const identity = character.identity;
  const entries: Array<{ definitionId: string | undefined; kind: string }> = [
    { definitionId: identity.primaryClassId, kind: "Classe" },
    { definitionId: identity.primarySubclassId, kind: "Subclasse" },
    { definitionId: identity.primaryAncestryId, kind: "Ancestralidade" },
    { definitionId: identity.primaryCommunityId, kind: "Comunidade" },
    { definitionId: identity.transformationId, kind: "Transformação" },
    ...(identity.primaryDomainIds ?? []).map((definitionId) => ({ definitionId, kind: "Domínio" })),
    ...(identity.ancestryIds ?? []).map((definitionId) => ({ definitionId, kind: "Ancestralidade" })),
    ...Object.values(identity.ancestryFeatureIds ?? {}).map((definitionId) => ({ definitionId, kind: "Feature de ancestralidade" })),
    ...character.deck.learnedCardIds.map((definitionId) => ({ definitionId, kind: "Carta no Vault" })),
    ...character.deck.activeCardIds.map((definitionId) => ({ definitionId, kind: "Carta no Loadout" })),
    ...(character.deck.unavailableCards ?? []).map(({ cardId: definitionId }) => ({ definitionId, kind: "Carta indisponível" })),
    ...character.inventory.entries.map(({ definitionId }) => ({ definitionId, kind: "Item no inventário" })),
    ...(character.activeConditions ?? []).map(({ conditionId: definitionId }) => ({ definitionId, kind: "Condição ativa" })),
    ...(character.activeFeatureEffects ?? []).map(({ featureId: definitionId }) => ({ definitionId, kind: "Feature ativa" })),
    ...(character.gameMarkers ?? []).map(({ sourceDefinitionId: definitionId }) => ({ definitionId, kind: "Marcador" })),
    ...(character.definitionSelections ?? []).map(({ sourceDefinitionId: definitionId }) => ({ definitionId, kind: "Escolha de Feature" })),
    ...(character.progression?.multiclass ? Object.entries(character.progression.multiclass).filter(([key]) => key.endsWith("Id")).map(([, definitionId]) => ({ definitionId, kind: "Multiclasse" })) : [])
  ];
  return entries.filter((entry): entry is { definitionId: string; kind: string } => Boolean(entry.definitionId));
}

function deduplicate(references: PackUsageReference[]): PackUsageReference[] {
  const seen = new Set<string>();
  return references.filter((reference) => {
    const key = `${reference.characterId}:${reference.definitionId}:${reference.kind}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
