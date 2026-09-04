import type { Catalog } from "../../domain/catalog";
import type { Attribute, CardDefinition, Character, CharacterSheetModifier, Defense, FeatureDefinition } from "../../domain/types";

/**
 * Calcula os bônus permanentes das fontes ativas da ficha.
 *
 * A coleta centraliza Features e cartas ativas. Assim, mover uma carta para o
 * Loadout aplica seus bônus passivos; devolvê-la ao Vault os remove sem
 * gravar modificadores duplicados na ficha.
 */
export function synchronizeCharacterSheetModifiers(character: Character, catalog: Catalog): Character {
  const modifiers = getActiveSheetModifiers(character, catalog);
  const attributes = getModifiedAttributes(character.attributes, modifiers);
  const resourceBonuses = getResourceBonuses(modifiers);
  const defense = getModifiedDefense(character, attributes, modifiers);
  const resources = character.resources.map((resource) => {
    const baseMax = getProgressionResourceBaseMax(character, catalog, resource.id, resource.baseMax ?? resource.max);
    const max = Math.max(0, baseMax + (resourceBonuses.get(resource.id) ?? 0));
    return resource.baseMax === baseMax && resource.max === max && resource.value <= max
      ? resource
      : { ...resource, baseMax, max, value: Math.min(resource.value, max) };
  });

  const resourcesChanged = resources.some((resource, index) => resource !== character.resources[index]);
  const attributesChanged = attributes.some((attribute, index) => attribute !== character.attributes[index]);
  const defenseChanged = !sameDefense(character.defense, defense) || !character.baseDefense;
  return resourcesChanged || attributesChanged || defenseChanged
    ? { ...character, attributes, resources, defense, baseDefense: character.baseDefense ?? character.defense }
    : character;
}

function getProgressionResourceBaseMax(character: Character, catalog: Catalog, resourceId: string, fallback: number): number {
  const selections = character.progression?.advancementSelections ?? [];
  const advances = selections.filter((selection) => selection.kind === resourceId).length;
  if (!advances) return fallback;
  if (resourceId === "hp") return (catalog.classes.find((entry) => entry.id === character.identity.primaryClassId)?.startingHitPoints ?? fallback) + advances;
  return resourceId === "stress" ? 6 + advances : fallback;
}

export function getActiveSheetModifiers(character: Character, catalog: Catalog): CharacterSheetModifier[] {
  return [
    ...getActiveAncestryFeatures(character, catalog),
    ...getActiveClassFeatures(character, catalog),
    ...getActiveMulticlassFeatures(character, catalog),
    ...getActiveCards(character, catalog)
  ].flatMap((definition) => definition.sheetModifiers ?? []);
}

function getActiveCards(character: Character, catalog: Catalog): CardDefinition[] {
  return character.deck.activeCardIds
    .flatMap((id) => [catalog.cards.find((card) => card.id === id)])
    .filter((card): card is CardDefinition => Boolean(card));
}

function getActiveAncestryFeatures(character: Character, catalog: Catalog): FeatureDefinition[] {
  const selected = character.identity.ancestryFeatureIds;
  if (!selected) return [];
  return [selected.top, selected.bottom]
    .flatMap((id) => id ? [catalog.features.find((feature) => feature.id === id)] : [])
    .filter((feature): feature is FeatureDefinition => Boolean(feature && feature.sourceType === "ancestry"));
}

function getActiveClassFeatures(character: Character, catalog: Catalog): FeatureDefinition[] {
  const characterClass = catalog.classes.find((entry) => entry.id === character.identity.primaryClassId);
  if (!characterClass) return [];
  const featureIds = new Set([...characterClass.featureIds, characterClass.hopeFeatureId]);
  const subclass = catalog.subclasses.find((entry) => entry.id === character.identity.primarySubclassId && entry.classId === characterClass.id);
  if (subclass) {
    const acquired = new Set(character.progression?.acquiredSubclassTiers ?? ["foundation"]);
    if (acquired.has("foundation")) subclass.foundationFeatureIds.forEach((id) => featureIds.add(id));
    if (acquired.has("specialized")) subclass.specializationFeatureIds.forEach((id) => featureIds.add(id));
    if (acquired.has("mastery")) subclass.masteryFeatureIds.forEach((id) => featureIds.add(id));
  }
  return [...featureIds]
    .flatMap((id) => [catalog.features.find((feature) => feature.id === id)])
    .filter((feature): feature is FeatureDefinition => Boolean(feature));
}

/** A Multiclasse concede uma Feature de classe e uma Fundação adicionais. */
function getActiveMulticlassFeatures(character: Character, catalog: Catalog): FeatureDefinition[] {
  const multiclass = character.progression?.multiclass;
  if (!multiclass) return [];
  return [multiclass.featureId, multiclass.foundationFeatureId]
    .flatMap((id) => [catalog.features.find((feature) => feature.id === id)])
    .filter((feature): feature is FeatureDefinition => Boolean(feature));
}

function getResourceBonuses(modifiers: CharacterSheetModifier[]): Map<string, number> {
  return modifiers.reduce((bonuses, modifier) => {
    if (modifier.kind === "resource-max") bonuses.set(modifier.resourceId, (bonuses.get(modifier.resourceId) ?? 0) + modifier.amount);
    return bonuses;
  }, new Map<string, number>());
}

function getModifiedAttributes(attributes: Attribute[], modifiers: CharacterSheetModifier[]): Attribute[] {
  return attributes.map((attribute) => {
    const baseValue = attribute.baseValue ?? attribute.value;
    const amount = modifiers.reduce((total, modifier) => modifier.kind === "attribute" && modifier.attributeId === attribute.id ? total + modifier.amount : total, 0);
    const value = baseValue + amount;
    return attribute.baseValue === baseValue && attribute.value === value ? attribute : { ...attribute, baseValue, value };
  });
}

function getModifiedDefense(character: Character, attributes: Attribute[], modifiers: CharacterSheetModifier[]): Defense {
  const base = getProgressionBaseDefense(character);
  return modifiers.reduce<Defense>((defense, modifier) => {
    if (modifier.kind === "defense") return { ...defense, [modifier.field]: defense[modifier.field] + modifier.amount };
    if (modifier.kind === "defense-per-attribute") {
      const attribute = attributes.find((entry) => entry.id === modifier.attributeId)?.value ?? 0;
      const multiplier = modifier.multiplier ?? 1;
      const divisor = modifier.divisor ?? 1;
      return { ...defense, [modifier.field]: defense[modifier.field] + Math.ceil((attribute * multiplier) / divisor) };
    }
    if (modifier.kind === "defense-per-proficiency") return { ...defense, [modifier.field]: defense[modifier.field] + character.proficiency * modifier.amount };
    return defense;
  }, { ...base });
}

/** Reconstitui bônus permanentes de Evasão, inclusive em fichas salvas antes da correção. */
function getProgressionBaseDefense(character: Character): Defense {
  const base = character.baseDefense ?? character.defense;
  const evasionAdvances = (character.progression?.advancementSelections ?? []).filter((selection) => selection.kind === "evasion").length;
  return { ...base, evasion: base.evasion + evasionAdvances };
}

function sameDefense(left: Defense, right: Defense): boolean {
  return left.evasion === right.evasion && left.armor === right.armor && left.minor === right.minor && left.major === right.major;
}
