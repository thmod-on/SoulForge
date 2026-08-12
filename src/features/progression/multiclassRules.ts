import type { CardDefinition, Character, CharacterMulticlass, ClassDefinition, FeatureDefinition, SubclassDefinition } from "../../domain/types";
import type { ProgressionDraftChoice, ProgressionTierNumber } from "../../app/types";

export type MulticlassCatalog = {
  classes: ClassDefinition[];
  subclasses: SubclassDefinition[];
  features: FeatureDefinition[];
};

export function canChooseMulticlass(character: Character, tier: ProgressionTierNumber, draft: ProgressionDraftChoice[]): boolean {
  return tier >= 3
    && !character.progression?.multiclass
    && !draft.some((choice) => choice.kind === "multiclass")
    && !draft.some((choice) => choice.kind === "subclass" && choice.tier === tier);
}

export function isSubclassAdvanceBlockedByMulticlass(tier: ProgressionTierNumber, draft: ProgressionDraftChoice[]): boolean {
  return draft.some((choice) => choice.kind === "multiclass" && choice.tier === tier);
}

export function getEligibleMulticlassClasses(character: Character, catalog: MulticlassCatalog): ClassDefinition[] {
  return catalog.classes.filter((entry) => entry.id !== character.identity.primaryClassId && entry.name.toLocaleLowerCase("pt-BR") !== character.identity.className.toLocaleLowerCase("pt-BR"));
}

export function buildMulticlassChoice(
  character: Character,
  _tier: ProgressionTierNumber,
  selection: { classId?: string; domainId?: string; featureId?: string; subclassId?: string; foundationFeatureId?: string },
  catalog: MulticlassCatalog
): CharacterMulticlass | undefined {
  const classDefinition = getEligibleMulticlassClasses(character, catalog).find((entry) => entry.id === selection.classId);
  if (!classDefinition || !selection.domainId || !classDefinition.domainIds.includes(selection.domainId)) return undefined;
  const feature = catalog.features.find((entry) => entry.id === selection.featureId && entry.sourceType === "class" && entry.sourceId === classDefinition.id);
  const subclass = catalog.subclasses.find((entry) => entry.id === selection.subclassId && entry.classId === classDefinition.id);
  const foundation = catalog.features.find((entry) => entry.id === selection.foundationFeatureId && entry.sourceType === "subclass" && entry.sourceId === subclass?.id && entry.tier === "foundation");
  if (!feature || !subclass || !foundation) return undefined;
  return {
    classId: classDefinition.id,
    className: classDefinition.name,
    domainId: selection.domainId,
    domainName: selection.domainId,
    featureId: feature.id,
    featureName: feature.name,
    subclassId: subclass.id,
    subclassName: subclass.name,
    foundationFeatureId: foundation.id,
    foundationFeatureName: foundation.name,
    spellcastAttributeId: subclass.spellcastAttributeId
  };
}

/** Cartas de um domínio secundário usam metade do nível atual, arredondada para cima. */
export function canLearnMulticlassDomainCard(card: CardDefinition, character: Character): boolean {
  const multiclass = character.progression?.multiclass;
  return Boolean(multiclass && card.domainId === multiclass.domainId && card.tier <= Math.ceil((character.identity.level + 1) / 2));
}
