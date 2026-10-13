import type { Attribute } from "../../domain/types";
import { handleCreationAttributeAllocation, type CreationAttributeTokenAssignments } from "./attributeAllocation";

export type CharacterAttributeAllocationUiState = {
  characterCreationOpen: boolean;
  characterCreationStep: number;
  characterCreationAttributeValues: Record<Attribute["id"], number>;
  characterCreationActiveAttributeId?: Attribute["id"];
  characterCreationAttributeTokenIds: CreationAttributeTokenAssignments;
  characterCreationError?: string;
};

export function handleCharacterAttributeAllocationAction(target: HTMLElement, state: CharacterAttributeAllocationUiState, root: HTMLElement, render: () => void): boolean {
  const control = target.closest<HTMLElement>("[data-character-attribute-allocation]");
  if (!control) return false;
  const action = control.dataset.characterAttributeAllocation;
  if (action === "reset" && Object.values(state.characterCreationAttributeValues).some(Number.isInteger) && !window.confirm("Recomeçar a distribuição e liberar todos os valores de atributo?")) return true;

  const tokenId = control.dataset.characterAttributeTokenId;
  const result = handleCreationAttributeAllocation({
    values: state.characterCreationAttributeValues,
    activeAttributeId: state.characterCreationActiveAttributeId,
    assignedTokenIds: state.characterCreationAttributeTokenIds,
    action,
    attributeId: control.dataset.characterAttributeId,
    tokenId
  });
  state.characterCreationAttributeValues = result.values;
  state.characterCreationActiveAttributeId = result.activeAttributeId;
  state.characterCreationAttributeTokenIds = result.assignedTokenIds;
  state.characterCreationError = result.error;
  render();

  if (action === "activate") focusToken(root, result.activeAttributeId ? result.assignedTokenIds[result.activeAttributeId] : undefined);
  if (action === "assign-token") {
    focusToken(root, tokenId);
    if (result.activeAttributeId) animateAssignment(root, result.activeAttributeId);
  }
  if (action === "release") focusToken(root);
  if (action === "reset") focusCard(root);
  return true;
}

export function handleCharacterAttributeAllocationEscape(event: KeyboardEvent, state: CharacterAttributeAllocationUiState, root: HTMLElement, render: () => void): boolean {
  if (event.key !== "Escape" || !state.characterCreationOpen || state.characterCreationStep !== 6 || !state.characterCreationActiveAttributeId) return false;
  const attributeId = state.characterCreationActiveAttributeId;
  state.characterCreationActiveAttributeId = undefined;
  state.characterCreationError = undefined;
  event.preventDefault();
  render();
  focusCard(root, attributeId);
  return true;
}

function focusToken(root: HTMLElement, tokenId?: string): void {
  requestAnimationFrame(() => {
    const selector = tokenId ? `[data-character-attribute-token-id="${tokenId}"]` : '[data-character-attribute-allocation="assign-token"]:not(:disabled)';
    root.querySelector<HTMLButtonElement>(selector)?.focus();
  });
}

function focusCard(root: HTMLElement, attributeId?: Attribute["id"]): void {
  requestAnimationFrame(() => {
    const selector = attributeId
      ? `[data-character-attribute-allocation="activate"][data-character-attribute-id="${attributeId}"]`
      : '[data-character-attribute-allocation="activate"]';
    root.querySelector<HTMLButtonElement>(selector)?.focus({ preventScroll: true });
  });
}

function animateAssignment(root: HTMLElement, attributeId: Attribute["id"]): void {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  requestAnimationFrame(() => {
    root.querySelector<HTMLElement>(`[data-character-attribute-id="${attributeId}"] .character-attribute-slot`)?.animate(
      [{ transform: "scale(0.88)", opacity: 0.55 }, { transform: "scale(1.05)", opacity: 1 }, { transform: "scale(1)", opacity: 1 }],
      { duration: 220, easing: "cubic-bezier(.2,.8,.2,1)" }
    );
  });
}
