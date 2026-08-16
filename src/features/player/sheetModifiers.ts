import type { Catalog } from "../../domain/catalog";
import type { Character, CharacterSheetModifier, Defense, FeatureDefinition } from "../../domain/types";

/**
 * Calcula os bônus permanentes das fontes ativas da ficha.
 *
 * Nesta primeira etapa, as Features Top e Bottom de ancestralidade são as
 * fontes suportadas. A coleta fica isolada para que cartas, classes e outras
 * fontes possam ser incluídas sem mudar o modelo de recurso do personagem.
 */
export function synchronizeCharacterSheetModifiers(character: Character, catalog: Catalog): Character {
  const modifiers = getActiveSheetModifiers(character, catalog);
  const resourceBonuses = getResourceBonuses(modifiers);
  const defense = getModifiedDefense(character, modifiers);
  const resources = character.resources.map((resource) => {
    const baseMax = resource.baseMax ?? resource.max;
    const max = Math.max(0, baseMax + (resourceBonuses.get(resource.id) ?? 0));
    return resource.baseMax === baseMax && resource.max === max && resource.value <= max
      ? resource
      : { ...resource, baseMax, max, value: Math.min(resource.value, max) };
  });

  const resourcesChanged = resources.some((resource, index) => resource !== character.resources[index]);
  const defenseChanged = !sameDefense(character.defense, defense) || !character.baseDefense;
  return resourcesChanged || defenseChanged
    ? { ...character, resources, defense, baseDefense: character.baseDefense ?? character.defense }
    : character;
}

export function getActiveSheetModifiers(character: Character, catalog: Catalog): CharacterSheetModifier[] {
  return getActiveAncestryFeatures(character, catalog).flatMap((feature) => feature.sheetModifiers ?? []);
}

function getActiveAncestryFeatures(character: Character, catalog: Catalog): FeatureDefinition[] {
  const selected = character.identity.ancestryFeatureIds;
  if (!selected) return [];
  return [selected.top, selected.bottom]
    .flatMap((id) => id ? [catalog.features.find((feature) => feature.id === id)] : [])
    .filter((feature): feature is FeatureDefinition => Boolean(feature && feature.sourceType === "ancestry"));
}

function getResourceBonuses(modifiers: CharacterSheetModifier[]): Map<string, number> {
  return modifiers.reduce((bonuses, modifier) => {
    if (modifier.kind === "resource-max") bonuses.set(modifier.resourceId, (bonuses.get(modifier.resourceId) ?? 0) + modifier.amount);
    return bonuses;
  }, new Map<string, number>());
}

function getModifiedDefense(character: Character, modifiers: CharacterSheetModifier[]): Defense {
  const base = character.baseDefense ?? character.defense;
  return modifiers.reduce<Defense>((defense, modifier) => {
    if (modifier.kind === "defense") return { ...defense, [modifier.field]: defense[modifier.field] + modifier.amount };
    if (modifier.kind === "defense-per-proficiency") return { ...defense, [modifier.field]: defense[modifier.field] + character.proficiency * modifier.amount };
    return defense;
  }, { ...base });
}

function sameDefense(left: Defense, right: Defense): boolean {
  return left.evasion === right.evasion && left.armor === right.armor && left.minor === right.minor && left.major === right.major;
}
