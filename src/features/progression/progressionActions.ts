import type { Catalog } from "../../domain/catalog";
import type { CardDefinition, Character, CharacterProgression, CharacterProgressionEntry, ProgressionAdvanceKind } from "../../domain/types";
import type { ProgressionDraftChoice, ProgressionFlowStep, ProgressionTierNumber } from "../../app/types";
import { canLearnMulticlassDomainCard, isSubclassAdvanceBlockedByMulticlass } from "./multiclassRules";
import { getProgressionChoiceCost as getProgressionChoiceCostForKind } from "./progressionRules";

export type ProgressionActionState = {
  character?: Character;
  progressionDraft: ProgressionDraftChoice[];
  progressionError?: string;
  progressionCardId?: string;
  progressionTierExperience?: { name: string; description: string };
  progressionTierExperienceError?: string;
  progressionStep: ProgressionFlowStep;
  progressionCompletionLevel?: number;
};

export type ApplyProgressionDependencies = {
  state: ProgressionActionState;
  catalog: Catalog;
  saveCharacter(character: Character): Promise<void>;
  now?: () => string;
  createId?: () => string;
};

export function getProgression(character: Character): CharacterProgression {
  return character.progression ?? { attributeMarks: {}, acquiredSubclassTiers: ["foundation"], advancementSelections: [], history: [] };
}

export function getAdvanceSlotsUsed(character: Character, tier: ProgressionTierNumber, kind: ProgressionAdvanceKind, draft: ProgressionDraftChoice[]): number {
  const stored = getProgression(character).advancementSelections.filter((selection) => selection.tier === tier && selection.kind === kind).length;
  return stored + draft.filter((choice) => choice.tier === tier && choice.kind === kind).length;
}

export function getNextSubclassAdvance(character: Character, tier: ProgressionTierNumber, draft: ProgressionDraftChoice[]): "specialized" | "mastery" | undefined {
  if (isSubclassAdvanceBlockedByMulticlass(tier, draft)) return undefined;
  const acquired = getProgression(character).acquiredSubclassTiers;
  if (!acquired.includes("specialized") && tier >= 3) return "specialized";
  if (acquired.includes("specialized") && !acquired.includes("mastery") && tier >= 4) return "mastery";
  return undefined;
}

export function getProgressionChoiceCount(draft: ProgressionDraftChoice[]): number {
  return draft.reduce((total, choice) => total + getProgressionChoiceCostForKind(choice.kind), 0);
}

export function getPrimaryDomainIds(character: Character, catalog: Catalog): string[] {
  const byId = character.identity.primaryClassId ? catalog.classes.find((definition) => definition.id === character.identity.primaryClassId) : undefined;
  const byName = catalog.classes.find((definition) => definition.name.toLocaleLowerCase("pt-BR") === character.identity.className.toLocaleLowerCase("pt-BR"));
  return byId?.domainIds ?? byName?.domainIds ?? character.identity.primaryDomainIds ?? [];
}

export function getProgressionCardCandidates(character: Character, catalog: Catalog, state: Pick<ProgressionActionState, "progressionCardId" | "progressionDraft">, includeReserved = false): CardDefinition[] {
  const nextLevel = Math.min(character.identity.level + 1, 10);
  const domainIds = getPrimaryDomainIds(character, catalog);
  const reservedCardIds = [state.progressionCardId, ...state.progressionDraft.map((choice) => choice.cardId)].filter(Boolean);
  return catalog.cards.filter((card) => {
    const primaryCard = domainIds.includes(card.domainId) && card.tier <= nextLevel;
    const secondaryCard = canLearnMulticlassDomainCard(card, character);
    return (primaryCard || secondaryCard) && !character.deck.learnedCardIds.includes(card.id) && (includeReserved || !reservedCardIds.includes(card.id));
  });
}

export function requiresTierExperience(character: Character): boolean {
  return [2, 5, 8].includes(character.identity.level + 1);
}

export function addProgressionChoice(state: Pick<ProgressionActionState, "progressionDraft" | "progressionError">, choice: ProgressionDraftChoice): boolean {
  if (getProgressionChoiceCount(state.progressionDraft) + getProgressionChoiceCostForKind(choice.kind) > 2) return false;
  state.progressionDraft = [...state.progressionDraft, choice];
  state.progressionError = undefined;
  return true;
}

export async function applyProgression(deps: ApplyProgressionDependencies): Promise<Character | undefined> {
  const { state, catalog } = deps;
  const character = state.character;
  if (!character || getProgressionChoiceCount(state.progressionDraft) !== 2 || !state.progressionCardId || character.identity.level >= 10 || (requiresTierExperience(character) && !state.progressionTierExperience?.name.trim())) return undefined;

  const nextLevel = character.identity.level + 1;
  const progression = getProgression(character);
  const choices = state.progressionDraft;
  const attributeIds = choices.flatMap((choice) => choice.attributeIds ?? []);
  const experienceIds = choices.flatMap((choice) => choice.experienceIds ?? []);
  const hpSlots = choices.filter((choice) => choice.kind === "hp").length;
  const stressSlots = choices.filter((choice) => choice.kind === "stress").length;
  const evasionBonus = choices.filter((choice) => choice.kind === "evasion").length;
  const proficiencyBonus = choices.some((choice) => choice.kind === "proficiency") ? 1 : 0;
  const subclassChoice = choices.find((choice) => choice.kind === "subclass");
  const multiclassChoice = choices.find((choice) => choice.kind === "multiclass");
  const subclassAdvance = subclassChoice ? getNextSubclassAdvance(character, subclassChoice.tier, choices) : undefined;
  const additionalCardIds = choices.flatMap((choice) => choice.kind === "domain" && choice.cardId ? [choice.cardId] : []);
  const isTierAchievement = [2, 5, 8].includes(nextLevel);
  const tierExperience = isTierAchievement ? state.progressionTierExperience : undefined;
  const tierAchievement = tierExperience ? `Experiencia +2: ${tierExperience.name}; Proficiencia +1` : undefined;
  const chosenCard = catalog.cards.find((card) => card.id === state.progressionCardId);
  if (!chosenCard || !getProgressionCardCandidates(character, catalog, state, true).some((card) => card.id === chosenCard.id)) return undefined;
  if (multiclassChoice && !multiclassChoice.multiclass) return undefined;

  const historyEntry: CharacterProgressionEntry = {
    level: nextLevel,
    appliedAt: deps.now?.() ?? new Date().toISOString(),
    choices: [...choices.map((choice) => choice.label), `Carta de Dominio: ${chosenCard.name} → Vault`, ...(tierExperience ? [`Experiencia de Tier +2: ${tierExperience.name}`] : [])],
    advances: choices.map((choice) => ({ kind: choice.kind, label: choice.label })),
    tierAchievement
  };
  const resources = character.resources.map((resource) => resource.id === "hp"
    ? { ...resource, baseMax: (resource.baseMax ?? resource.max) + hpSlots, max: resource.max + hpSlots }
    : resource.id === "stress"
      ? { ...resource, baseMax: (resource.baseMax ?? resource.max) + stressSlots, max: resource.max + stressSlots }
      : resource);
  const attributeMarks: Record<string, string[]> = isTierAchievement ? {} : { ...progression.attributeMarks };
  choices.filter((choice) => choice.attributeIds?.length).forEach((choice) => {
    const existing = attributeMarks[String(choice.tier)] ?? [];
    attributeMarks[String(choice.tier)] = [...new Set([...existing, ...(choice.attributeIds ?? [])])];
  });

  const updatedCharacter: Character = {
    ...character,
    identity: { ...character.identity, level: nextLevel },
    attributes: character.attributes.map((attribute) => {
      const wasSelected = attributeIds.includes(attribute.id);
      const baseValue = attribute.baseValue ?? attribute.value;
      return { ...attribute, baseValue: baseValue + (wasSelected ? 1 : 0), value: baseValue + (wasSelected ? 1 : 0), upgraded: wasSelected ? true : isTierAchievement ? false : attribute.upgraded };
    }),
    defense: { ...character.defense, evasion: character.defense.evasion + evasionBonus },
    proficiency: character.proficiency + proficiencyBonus + (isTierAchievement ? 1 : 0),
    resources,
    deck: { activeCardIds: character.deck.activeCardIds, learnedCardIds: [...character.deck.learnedCardIds, chosenCard.id, ...additionalCardIds] },
    experiences: character.experiences.map((experience) => experienceIds.includes(experience.id) ? { ...experience, value: experience.value + 1 } : experience).concat(tierExperience ? [{ id: `experience.tier.${nextLevel}.${deps.createId?.() ?? crypto.randomUUID()}`, name: tierExperience.name, value: 2, description: tierExperience.description }] : []),
    progression: {
      attributeMarks,
      acquiredSubclassTiers: subclassAdvance ? [...progression.acquiredSubclassTiers, subclassAdvance] : progression.acquiredSubclassTiers,
      multiclass: multiclassChoice?.multiclass ?? progression.multiclass,
      advancementSelections: [...progression.advancementSelections, ...choices.map((choice) => ({ kind: choice.kind, tier: choice.tier, level: nextLevel }))],
      history: [...progression.history, historyEntry]
    }
  };

  await deps.saveCharacter(updatedCharacter);
  state.character = updatedCharacter;
  state.progressionDraft = [];
  state.progressionError = undefined;
  state.progressionCardId = undefined;
  state.progressionTierExperience = undefined;
  state.progressionTierExperienceError = undefined;
  state.progressionStep = "advances";
  state.progressionCompletionLevel = nextLevel;
  return updatedCharacter;
}
