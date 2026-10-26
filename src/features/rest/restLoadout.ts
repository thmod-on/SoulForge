import type { Character } from "../../domain/types";

export type RestLoadoutStage = "loadout" | "moves";

/** O Loadout do descanso é sempre um rascunho: a ficha só muda na confirmação. */
export function getRestLoadoutDraft(character: Character): string[] {
  return [...character.deck.activeCardIds];
}

export function getRestVaultCardIds(character: Character, activeCardIds: string[]): string[] {
  const active = new Set(activeCardIds);
  return character.deck.learnedCardIds.filter((cardId) => !active.has(cardId));
}

export function canContinueRestLoadout(character: Character, activeCardIds: string[]): boolean {
  const learned = new Set(character.deck.learnedCardIds);
  return activeCardIds.length <= 5 && new Set(activeCardIds).size === activeCardIds.length && activeCardIds.every((cardId) => learned.has(cardId));
}

export function addRestLoadoutCard(activeCardIds: string[], cardId: string): string[] {
  return activeCardIds.includes(cardId) || activeCardIds.length >= 5 ? activeCardIds : [...activeCardIds, cardId];
}

export function removeRestLoadoutCard(activeCardIds: string[], cardId: string): string[] {
  return activeCardIds.filter((entry) => entry !== cardId);
}

export function moveRestLoadoutCard(activeCardIds: string[], cardId: string, direction: -1 | 1): string[] {
  const index = activeCardIds.indexOf(cardId), nextIndex = index + direction;
  if (index < 0 || nextIndex < 0 || nextIndex >= activeCardIds.length) return activeCardIds;
  const next = [...activeCardIds];
  [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
  return next;
}

/** Move uma carta existente ou insere uma carta do Vault no espaço escolhido. */
export function placeRestLoadoutCard(activeCardIds: string[], cardId: string, slotIndex: number): string[] {
  if (!Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex > activeCardIds.length || slotIndex >= 5) return activeCardIds;
  const currentIndex = activeCardIds.indexOf(cardId);
  if (currentIndex < 0 && activeCardIds.length >= 5) return activeCardIds;
  const next = currentIndex < 0 ? [...activeCardIds] : activeCardIds.filter((entry) => entry !== cardId);
  next.splice(Math.min(slotIndex, next.length), 0, cardId);
  return next;
}

export function applyRestLoadout(character: Character, activeCardIds: string[]): Character {
  return activeCardIds.every((cardId, index) => cardId === character.deck.activeCardIds[index]) && activeCardIds.length === character.deck.activeCardIds.length
    ? character
    : { ...character, deck: { ...character.deck, activeCardIds: [...activeCardIds] } };
}
