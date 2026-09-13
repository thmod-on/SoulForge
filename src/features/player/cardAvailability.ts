import type { CardReactivationTiming, Character, CharacterUnavailableCard } from "../../domain/types";

export const cardReactivationLabels: Record<CardReactivationTiming, string> = {
  rest: "no próximo descanso",
  "long-rest": "no próximo descanso longo",
  session: "na próxima sessão",
  manual: "manualmente"
};

const timings = new Set<CardReactivationTiming>(["rest", "long-rest", "session", "manual"]);

export function getUnavailableCard(character: Character, cardId: string): CharacterUnavailableCard | undefined {
  return character.deck.unavailableCards?.find((entry) => entry.cardId === cardId);
}

export function isCardUnavailable(character: Character, cardId: string): boolean {
  return Boolean(getUnavailableCard(character, cardId));
}

export function deactivateCard(character: Character, cardId: string, reactivation: CardReactivationTiming, deactivatedAt = new Date().toISOString()): Character {
  if (!character.deck.activeCardIds.includes(cardId) || !timings.has(reactivation)) return character;
  const unavailableCards = [...(character.deck.unavailableCards ?? []).filter((entry) => entry.cardId !== cardId), { cardId, reactivation, deactivatedAt }];
  return { ...character, deck: { ...character.deck, unavailableCards } };
}

export function reactivateCardManually(character: Character, cardId: string): Character {
  if (getUnavailableCard(character, cardId)?.reactivation !== "manual") return character;
  return removeUnavailableCards(character, (entry) => entry.cardId === cardId);
}

export function reactivateCardsForEvent(character: Character, event: Exclude<CardReactivationTiming, "manual">): Character {
  return removeUnavailableCards(character, (entry) => entry.reactivation === event || (event === "long-rest" && entry.reactivation === "rest"));
}

export function pruneUnavailableCards(character: Character): Character {
  const activeCardIds = new Set(character.deck.activeCardIds);
  return removeUnavailableCards(character, (entry) => !activeCardIds.has(entry.cardId));
}

export function hasCardsAwaitingReactivation(character: Character, reactivation: CardReactivationTiming): boolean {
  return Boolean(character.deck.unavailableCards?.some((entry) => entry.reactivation === reactivation));
}

export type CardAvailabilityActionDependencies = {
  state: { character?: Character };
  saveCharacter: (character: Character) => Promise<void>;
  render: () => void;
};

export function handleCardAvailabilityAction(target: HTMLElement, dependencies: CardAvailabilityActionDependencies): boolean {
  const deactivate = target.closest<HTMLElement>('[data-action="deactivate-loadout-card"]');
  const reactivate = target.closest<HTMLElement>('[data-action="reactivate-loadout-card"]');
  if (!deactivate && !reactivate) return false;
  const character = dependencies.state.character;
  const cardId = (deactivate ?? reactivate)?.dataset.cardId;
  if (!character || !cardId) return true;
  const timing = deactivate?.dataset.reactivation as CardReactivationTiming | undefined;
  const updated = timing ? deactivateCard(character, cardId, timing) : reactivateCardManually(character, cardId);
  if (updated === character) return true;
  dependencies.state.character = updated;
  void dependencies.saveCharacter(updated).then(dependencies.render);
  return true;
}

function removeUnavailableCards(character: Character, shouldRemove: (entry: CharacterUnavailableCard) => boolean): Character {
  const current = character.deck.unavailableCards ?? [];
  const unavailableCards = current.filter((entry) => !shouldRemove(entry));
  if (unavailableCards.length === current.length) return character;
  return { ...character, deck: { ...character.deck, unavailableCards } };
}
