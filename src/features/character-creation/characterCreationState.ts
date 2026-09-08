import type { Catalog } from "../../domain/catalog";
import type { AncestryDefinition, Attribute } from "../../domain/types";
import { createEmptyCreationAttributeValues } from "./attributeAllocation";
import { getCreationClasses, getCreationSubclasses, validateCreationStep, type CharacterCreationDraft, type CharacterCreationFallback } from "./characterCreationRules";
import type { CharacterCreationStep } from "./creationFlow";

export type CharacterCreationState = {
  characterCreationOpen: boolean;
  characterCreationStep: CharacterCreationStep;
  characterCreationName: string;
  characterCreationCommunity: string;
  characterCreationCommunityId?: string;
  characterCreationCommunitySearch: string;
  characterCreationCommunityPackId: string;
  characterCreationClassId?: string;
  characterCreationSubclassId?: string;
  characterCreationAncestryIds: string[];
  characterCreationAncestrySearch: string;
  characterCreationCardIds: string[];
  characterCreationCardDomainId?: string;
  characterCreationFocusedCardId?: string;
  characterCreationExperiences: Array<{ name: string; description: string }>;
  characterCreationAttributeValues: Record<Attribute["id"], number>;
  characterCreationSelectedAttributeValue?: number;
  characterCreationPortraitImage?: string;
  characterCreationTopFeatureId?: string;
  characterCreationBottomFeatureId?: string;
  characterCreationError?: string;
};

export function openCharacterCreation(state: CharacterCreationState, catalog: Catalog, fallback: CharacterCreationFallback): void {
  const classes = getCreationClasses(catalog, fallback);
  state.characterCreationOpen = true;
  state.characterCreationClassId = classes[0]?.id;
  state.characterCreationSubclassId = getCreationSubclasses(catalog, state.characterCreationClassId ?? "", fallback)[0]?.id;
  state.characterCreationStep = 1;
  state.characterCreationName = "";
  state.characterCreationCommunity = "";
  state.characterCreationCommunityId = catalog.communities[0]?.id;
  state.characterCreationCommunitySearch = "";
  state.characterCreationCommunityPackId = "todos";
  state.characterCreationAncestryIds = [];
  state.characterCreationAncestrySearch = "";
  state.characterCreationCardIds = [];
  state.characterCreationFocusedCardId = undefined;
  state.characterCreationExperiences = [{ name: "", description: "" }, { name: "", description: "" }];
  state.characterCreationAttributeValues = createEmptyCreationAttributeValues();
  state.characterCreationSelectedAttributeValue = undefined;
  state.characterCreationPortraitImage = undefined;
  state.characterCreationCardDomainId = undefined;
  state.characterCreationTopFeatureId = undefined;
  state.characterCreationBottomFeatureId = undefined;
  state.characterCreationError = undefined;
}

export function closeCharacterCreation(state: CharacterCreationState): void {
  state.characterCreationOpen = false;
  state.characterCreationStep = 1;
  state.characterCreationAncestryIds = [];
  state.characterCreationAncestrySearch = "";
  state.characterCreationCardIds = [];
  state.characterCreationFocusedCardId = undefined;
  state.characterCreationAttributeValues = createEmptyCreationAttributeValues();
  state.characterCreationSelectedAttributeValue = undefined;
  state.characterCreationPortraitImage = undefined;
  state.characterCreationCardDomainId = undefined;
  state.characterCreationTopFeatureId = undefined;
  state.characterCreationBottomFeatureId = undefined;
  state.characterCreationError = undefined;
}

export function getCharacterCreationDraft(state: CharacterCreationState): CharacterCreationDraft {
  return {
    name: state.characterCreationName,
    community: state.characterCreationCommunity,
    communityId: state.characterCreationCommunityId,
    classId: state.characterCreationClassId,
    subclassId: state.characterCreationSubclassId,
    ancestryIds: state.characterCreationAncestryIds,
    topFeatureId: state.characterCreationTopFeatureId,
    bottomFeatureId: state.characterCreationBottomFeatureId,
    cardIds: state.characterCreationCardIds,
    attributeValues: state.characterCreationAttributeValues,
    portraitImage: state.characterCreationPortraitImage,
    experiences: state.characterCreationExperiences
  };
}

export function syncCharacterCreationDraftFromForm(state: CharacterCreationState, root: ParentNode = document): void {
  state.characterCreationName = root.querySelector<HTMLInputElement>("[data-character-name]")?.value.trim() ?? state.characterCreationName;
  state.characterCreationCommunity = root.querySelector<HTMLInputElement>("[data-character-community]")?.value.trim() ?? state.characterCreationCommunity;
  state.characterCreationTopFeatureId = root.querySelector<HTMLSelectElement>('[data-creation-panel="3"] [data-character-top-feature]')?.value ?? state.characterCreationTopFeatureId;
  state.characterCreationBottomFeatureId = root.querySelector<HTMLSelectElement>('[data-creation-panel="3"] [data-character-bottom-feature]')?.value ?? state.characterCreationBottomFeatureId;
  root.querySelectorAll<HTMLInputElement>("[data-character-experience-name]").forEach((input) => {
    const index = Number(input.dataset.characterExperienceName);
    if (Number.isInteger(index) && state.characterCreationExperiences[index]) {
      state.characterCreationExperiences[index] = { ...state.characterCreationExperiences[index], name: input.value };
    }
  });
}

export function validateCharacterCreationState(state: CharacterCreationState, catalog: Catalog, fallback: CharacterCreationFallback): boolean {
  if (state.characterCreationStep === 2) {
    const primary = catalog.ancestries.find((ancestry) => ancestry.id === state.characterCreationAncestryIds[0]);
    const secondary = catalog.ancestries.find((ancestry) => ancestry.id === state.characterCreationAncestryIds[1]);
    state.characterCreationTopFeatureId = primary?.topFeatureId;
    state.characterCreationBottomFeatureId = secondary?.bottomFeatureId ?? primary?.bottomFeatureId;
  }
  state.characterCreationError = validateCreationStep(state.characterCreationStep, getCharacterCreationDraft(state), catalog, fallback);
  return !state.characterCreationError;
}

export function toggleCharacterCreationAncestry(state: CharacterCreationState, ancestryId: string, selected: boolean): void {
  state.characterCreationAncestryIds = selected
    ? [...new Set([...state.characterCreationAncestryIds, ancestryId])].slice(0, 2)
    : state.characterCreationAncestryIds.filter((id) => id !== ancestryId);
  state.characterCreationTopFeatureId = undefined;
  state.characterCreationBottomFeatureId = undefined;
  state.characterCreationError = undefined;
}

export function selectCharacterCreationTopFeature(state: CharacterCreationState, catalog: Catalog, featureId: string): void {
  state.characterCreationTopFeatureId = featureId;
  const ancestries = getSelectedAncestries(state, catalog);
  if (ancestries.length === 2) {
    const origin = ancestries.find((ancestry) => ancestry.topFeatureId === featureId);
    state.characterCreationBottomFeatureId = ancestries.find((ancestry) => ancestry.id !== origin?.id)?.bottomFeatureId;
  }
  state.characterCreationError = undefined;
}

export function selectCharacterCreationClass(state: CharacterCreationState, catalog: Catalog, fallback: CharacterCreationFallback, classId: string): void {
  state.characterCreationClassId = classId;
  state.characterCreationSubclassId = getCreationSubclasses(catalog, classId, fallback)[0]?.id;
  state.characterCreationCardIds = [];
  state.characterCreationFocusedCardId = undefined;
  state.characterCreationCardDomainId = undefined;
  state.characterCreationError = undefined;
}

export function toggleCharacterCreationCard(state: CharacterCreationState, cardId: string): void {
  state.characterCreationCardIds = state.characterCreationCardIds.includes(cardId)
    ? state.characterCreationCardIds.filter((id) => id !== cardId)
    : state.characterCreationCardIds.length < 2 ? [...state.characterCreationCardIds, cardId] : state.characterCreationCardIds;
  state.characterCreationFocusedCardId = state.characterCreationCardIds.includes(cardId) ? cardId : state.characterCreationCardIds[0];
  state.characterCreationError = undefined;
}

function getSelectedAncestries(state: CharacterCreationState, catalog: Catalog): AncestryDefinition[] {
  return state.characterCreationAncestryIds.slice(0, 2)
    .map((id) => catalog.ancestries.find((ancestry) => ancestry.id === id))
    .filter((ancestry): ancestry is AncestryDefinition => Boolean(ancestry));
}
