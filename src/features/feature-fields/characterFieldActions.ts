import type { Catalog } from "../../domain/catalog";
import type { Character } from "../../domain/types";
import { setDefinitionSelectionValues } from "./featureFields";

export type CharacterFieldActionDependencies = {
  catalog: Catalog;
  character?: Character;
  update(character: Character, error?: string): void;
};

export function handleCharacterFieldAction(target: HTMLElement, dependencies: CharacterFieldActionDependencies): boolean {
  const button = target.closest<HTMLElement>('[data-action="save-character-feature-fields"]');
  if (!button || !dependencies.character) return false;
  const feature = dependencies.catalog.features.find((entry) => entry.id === button.dataset.featureId);
  const card = button.closest<HTMLElement>("[data-character-field-source]");
  if (!feature || !card) return true;
  const values = Object.fromEntries(Array.from(card.querySelectorAll<HTMLInputElement | HTMLSelectElement>("[data-character-field-edit]")).flatMap((input) => input.dataset.characterFieldId ? [[input.dataset.characterFieldId, input.value]] : []));
  const result = setDefinitionSelectionValues(dependencies.character, feature, values);
  result instanceof Error ? dependencies.update(dependencies.character, result.message) : dependencies.update(result);
  return true;
}
