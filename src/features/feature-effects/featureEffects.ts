import type { Catalog } from "../../domain/catalog";
import type { Character, CharacterActiveFeatureEffect, Defense, FeatureActivationDefinition, FeatureDefinition, FeatureEffectEndCondition } from "../../domain/types";

export type ActiveFeatureEffect = {
  state: CharacterActiveFeatureEffect;
  feature: FeatureDefinition;
  activation: FeatureActivationDefinition;
};

/** Lista somente efeitos cuja Feature continua ativa para a ficha atual. */
export function getActiveFeatureEffects(character: Character, catalog: Catalog): ActiveFeatureEffect[] {
  const activeFeatureIds = getAvailableFeatureIds(character, catalog);
  const effectByFeatureId = new Map<string, CharacterActiveFeatureEffect>();
  for (const effect of character.activeFeatureEffects ?? []) effectByFeatureId.set(effect.featureId, effect);
  return [...effectByFeatureId.values()].flatMap((state) => {
    const feature = catalog.features.find((entry) => entry.id === state.featureId);
    return feature?.activation && activeFeatureIds.has(feature.id) ? [{ state, feature, activation: feature.activation }] : [];
  });
}

/** Retorna a ativação apenas quando a Feature ainda pertence à ficha atual. */
export function getFeatureActivationForCharacter(character: Character, catalog: Catalog, featureId: string): FeatureActivationDefinition | undefined {
  const feature = catalog.features.find((entry) => entry.id === featureId);
  return feature?.activation && getAvailableFeatureIds(character, catalog).has(feature.id) ? feature.activation : undefined;
}

/** Remove os efeitos ativos cuja Definition declara o evento de encerramento recebido. */
export function endFeatureEffectsForCondition(character: Character, catalog: Catalog, condition: FeatureEffectEndCondition): Character {
  const endingIds = new Set(getActiveFeatureEffects(character, catalog)
    .filter((effect) => effect.activation.endsOn.includes(condition))
    .map((effect) => effect.feature.id));
  if (!endingIds.size) return character;
  return { ...character, activeFeatureEffects: (character.activeFeatureEffects ?? []).filter((effect) => !endingIds.has(effect.featureId)) };
}

/** Bônus temporários aplicados apenas à defesa exibida, jamais à defesa-base persistida. */
export function getActiveFeatureEffectDefenseModifiers(character: Character, catalog: Catalog): Partial<Defense> {
  const tier = getCharacterTier(character.identity.level);
  return getActiveFeatureEffects(character, catalog).reduce<Partial<Defense>>((bonus, effect) => {
    if (effect.state.target === "ally") return bonus;
    for (const modifier of effect.activation.modifiers) {
      if (modifier.kind === "defense") {
        for (const field of modifier.fields) bonus[field] = (bonus[field] ?? 0) + modifier.amount;
        continue;
      }
      if (modifier.kind !== "defense-per-tier") continue;
      for (const field of modifier.fields) bonus[field] = (bonus[field] ?? 0) + tier;
    }
    return bonus;
  }, {});
}

/** Tier de jogo: nível 1 pertence ao Tier 1; os demais seguem os marcos oficiais. */
export function getCharacterTier(level: number): 1 | 2 | 3 | 4 {
  return level >= 8 ? 4 : level >= 5 ? 3 : level >= 2 ? 2 : 1;
}

function getAvailableFeatureIds(character: Character, catalog: Catalog): Set<string> {
  const ids = new Set<string>();
  const characterClass = catalog.classes.find((entry) => entry.id === character.identity.primaryClassId);
  if (characterClass) {
    characterClass.featureIds.forEach((id) => ids.add(id));
    ids.add(characterClass.hopeFeatureId);
  }
  const subclass = catalog.subclasses.find((entry) => entry.id === character.identity.primarySubclassId);
  if (subclass) {
    const acquired = new Set(character.progression?.acquiredSubclassTiers ?? ["foundation"]);
    if (acquired.has("foundation")) subclass.foundationFeatureIds.forEach((id) => ids.add(id));
    if (acquired.has("specialized")) subclass.specializationFeatureIds.forEach((id) => ids.add(id));
    if (acquired.has("mastery")) subclass.masteryFeatureIds.forEach((id) => ids.add(id));
  }
  if (character.identity.ancestryFeatureIds?.top) ids.add(character.identity.ancestryFeatureIds.top);
  if (character.identity.ancestryFeatureIds?.bottom) ids.add(character.identity.ancestryFeatureIds.bottom);
  const community = catalog.communities.find((entry) => entry.id === character.identity.primaryCommunityId);
  if (community) ids.add(community.featureId);
  return ids;
}
