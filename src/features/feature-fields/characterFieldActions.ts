import type { Catalog } from "../../domain/catalog";
import type { Character } from "../../domain/types";
import { setDefinitionSelectionValues } from "./featureFields";

export type CharacterFieldActionDependencies = {
  catalog: Catalog;
  character?: Character;
  update(character: Character, error?: string): void;
};

export function handleCharacterFieldAction(target: HTMLElement, dependencies: CharacterFieldActionDependencies): boolean {
  const button = target.closest<HTMLElement>("[data-character-field-action]");
  if (!button || !dependencies.character) return false;
  const card = button.closest<HTMLElement>("[data-character-field-source]");
  if (!card) return true;
  const action = button.dataset.characterFieldAction;
  if (action === "edit" || action === "cancel") {
    setCharacterFieldEditing(card, action === "edit");
    return true;
  }
  const feature = dependencies.catalog.features.find((entry) => entry.id === card.dataset.characterFieldSource);
  if (action !== "save" || !feature) return true;
  const values = Object.fromEntries(Array.from(card.querySelectorAll<HTMLInputElement | HTMLSelectElement>("[data-character-field-edit]")).flatMap((input) => input.dataset.characterFieldId ? [[input.dataset.characterFieldId, input.value]] : []));
  const result = setDefinitionSelectionValues(dependencies.character, feature, values);
  if (result instanceof Error) {
    const error = card.querySelector<HTMLElement>("[data-character-field-error]");
    if (error) { error.textContent = result.message; error.hidden = false; error.focus(); }
  } else dependencies.update(result);
  return true;
}

function setCharacterFieldEditing(card: HTMLElement, editing: boolean): void {
  const view = card.querySelector<HTMLElement>("[data-character-field-view]");
  const editor = card.querySelector<HTMLElement>("[data-character-field-editor]");
  const editButton = card.querySelector<HTMLElement>('[data-character-field-action="edit"]');
  if (view) view.hidden = editing;
  if (editor) editor.hidden = !editing;
  if (editButton) editButton.hidden = editing;
  const error = card.querySelector<HTMLElement>("[data-character-field-error]");
  if (error) { error.hidden = true; error.textContent = ""; }
  if (!editing) { card.querySelectorAll<HTMLInputElement | HTMLSelectElement>("[data-character-field-edit]").forEach((input) => { input.value = input.dataset.characterFieldSavedValue ?? ""; }); editButton?.focus(); }
  if (editing) card.querySelector<HTMLInputElement | HTMLSelectElement>("[data-character-field-edit]")?.focus();
}
