import { describe, expect, it } from "vitest";
import { demoCharacter } from "../../domain/demoCharacter";
import { addRestLoadoutCard, applyRestLoadout, canContinueRestLoadout, getRestLoadoutDraft, getRestVaultCardIds, moveRestLoadoutCard, placeRestLoadoutCard, removeRestLoadoutCard } from "./restLoadout";

describe("rascunho de Loadout no descanso", () => {
  it("permite múltiplas trocas e preserva a ordem sem alterar a ficha original", () => {
    const learnedCardIds = ["card-a", "card-b", "card-c", "card-d", "card-e", "card-f"];
    const original = { ...demoCharacter, deck: { ...demoCharacter.deck, learnedCardIds, activeCardIds: learnedCardIds.slice(0, 3) } };
    let draft = getRestLoadoutDraft(original);
    const stored = getRestVaultCardIds(original, draft)[0];
    draft = removeRestLoadoutCard(draft, draft[1]);
    draft = addRestLoadoutCard(draft, stored);
    draft = moveRestLoadoutCard(draft, stored, -1);

    expect(original.deck.activeCardIds).toEqual(learnedCardIds.slice(0, 3));
    expect(draft).toContain(stored);
    expect(canContinueRestLoadout(original, draft)).toBe(true);
    expect(applyRestLoadout(original, draft).deck.activeCardIds).toEqual(draft);
  });

  it("não ultrapassa cinco cartas nem aceita IDs não aprendidos", () => {
    const learnedCardIds = ["card-a", "card-b", "card-c", "card-d", "card-e", "card-f"];
    const character = { ...demoCharacter, deck: { ...demoCharacter.deck, learnedCardIds, activeCardIds: learnedCardIds.slice(0, 5) } };
    const draft = character.deck.activeCardIds;
    expect(addRestLoadoutCard(draft, learnedCardIds[5])).toEqual(draft);
    expect(canContinueRestLoadout(character, [...draft, "inexistente"])).toBe(false);
  });

  it("insere do Vault em um espaço vazio e reordena uma carta ativa pelo espaço alvo", () => {
    expect(placeRestLoadoutCard(["a", "b", "c"], "vault", 1)).toEqual(["a", "vault", "b", "c"]);
    expect(placeRestLoadoutCard(["a", "b", "c"], "a", 2)).toEqual(["b", "c", "a"]);
    expect(placeRestLoadoutCard(["a", "b", "c", "d", "e"], "vault", 4)).toEqual(["a", "b", "c", "d", "e"]);
  });
});
