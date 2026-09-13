import { describe, expect, it } from "vitest";
import { demoCharacter } from "../../domain/demoCharacter";
import { deactivateCard, getUnavailableCard, pruneUnavailableCards, reactivateCardManually, reactivateCardsForEvent } from "./cardAvailability";

const cardIds = demoCharacter.deck.activeCardIds;

describe("disponibilidade manual de cartas", () => {
  it("mantém a carta no Loadout e registra a reativação escolhida na ficha", () => {
    const updated = deactivateCard(demoCharacter, cardIds[0], "long-rest", "2026-09-13T12:00:00.000Z");

    expect(updated.deck.activeCardIds).toContain(cardIds[0]);
    expect(getUnavailableCard(updated, cardIds[0])).toEqual({ cardId: cardIds[0], reactivation: "long-rest", deactivatedAt: "2026-09-13T12:00:00.000Z" });
  });

  it("reativa somente as cartas correspondentes ao evento", () => {
    const unavailableCards = [
      { cardId: cardIds[0], reactivation: "rest" as const, deactivatedAt: "a" },
      { cardId: cardIds[1], reactivation: "long-rest" as const, deactivatedAt: "b" },
      { cardId: cardIds[2], reactivation: "session" as const, deactivatedAt: "c" }
    ];
    const character = { ...demoCharacter, deck: { ...demoCharacter.deck, unavailableCards } };

    expect(reactivateCardsForEvent(character, "rest").deck.unavailableCards?.map((entry) => entry.cardId)).toEqual([cardIds[1], cardIds[2]]);
    expect(reactivateCardsForEvent(character, "long-rest").deck.unavailableCards?.map((entry) => entry.cardId)).toEqual([cardIds[2]]);
    expect(reactivateCardsForEvent(character, "session").deck.unavailableCards?.map((entry) => entry.cardId)).toEqual([cardIds[0], cardIds[1]]);
  });

  it("preserva a opção manual até uma reativação explícita", () => {
    const unavailable = deactivateCard(demoCharacter, cardIds[0], "manual");

    expect(reactivateCardsForEvent(unavailable, "long-rest")).toBe(unavailable);
    expect(reactivateCardsForEvent(unavailable, "session")).toBe(unavailable);
    expect(getUnavailableCard(reactivateCardManually(unavailable, cardIds[0]), cardIds[0])).toBeUndefined();
  });

  it("descarta estados órfãos quando uma carta deixa o Loadout", () => {
    const unavailable = deactivateCard(demoCharacter, cardIds[0], "manual");
    const stored = { ...unavailable, deck: { ...unavailable.deck, activeCardIds: cardIds.slice(1) } };

    expect(pruneUnavailableCards(stored).deck.unavailableCards).toEqual([]);
  });
});
