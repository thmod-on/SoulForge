import { describe, expect, it, vi } from "vitest";
import { createCatalog } from "../../domain/catalog";
import { demoCharacter } from "../../domain/demoCharacter";
import type { TransformationDefinition } from "../../domain/types";
import { assignCharacterTransformation, getCharacterTransformation, handleCharacterTransformationAction, removeCharacterTransformation, renderCharacterTransformationPanel } from "./characterTransformations";

const transformation: TransformationDefinition = { id: "transformation.test.vampire", type: "transformation", packId: "test", name: "Vampiro", summary: "Uma fome ancestral.", benefit: "Sentidos sobrenaturais.", drawback: "Fome constante.", narrativeQuestions: ["Quem transformou você?"] };
const catalog = createCatalog([], [transformation]);
const escapeHtml = (value: string) => value;

describe("transformação do personagem", () => {
  it("resolve somente a Definition referenciada pela identidade", () => {
    const character = { ...demoCharacter, identity: { ...demoCharacter.identity, transformationId: transformation.id } };
    expect(getCharacterTransformation(character, catalog)).toBe(transformation);
    expect(getCharacterTransformation(demoCharacter, catalog)).toBeUndefined();
  });

  it("substitui ou remove a única referência sem alterar o deck", () => {
    const assigned = assignCharacterTransformation(demoCharacter, transformation.id);
    const replaced = assignCharacterTransformation(assigned, "transformation.test.werewolf");
    const removed = removeCharacterTransformation(replaced);
    expect(replaced.identity.transformationId).toBe("transformation.test.werewolf");
    expect(replaced.deck).toEqual(demoCharacter.deck);
    expect(removed.identity.transformationId).toBeUndefined();
  });

  it("apresenta a transformação fora do Loadout", () => {
    const character = { ...demoCharacter, identity: { ...demoCharacter.identity, transformationId: transformation.id } };
    const html = renderCharacterTransformationPanel(character, catalog, escapeHtml);
    expect(html).toContain("Transformação ativa");
    expect(html).toContain("Vampiro");
    expect(html).toContain("não ocupa o Loadout");
    expect(html).not.toContain("data-card-modal-id");
  });

  it("preserva e sinaliza uma referência cujo Pack está ausente", () => {
    const character = { ...demoCharacter, identity: { ...demoCharacter.identity, transformationId: "transformation.missing" } };
    const html = renderCharacterTransformationPanel(character, catalog, escapeHtml);
    expect(html).toContain("Pack ausente");
    expect(html).toContain("transformation.missing");
    expect(html).toContain("Remover referência");
  });

  it("atualiza a opção do seletor sem renderizar novamente toda a ficha", () => {
    const classes = new Set<string>();
    const selectedOption = { classList: { add: (value: string) => classes.add(value), remove: (value: string) => classes.delete(value) } };
    const otherOption = { classList: { add: vi.fn(), remove: vi.fn() } };
    const selectedInput = { checked: false } as { checked: boolean; dataset?: Record<string, string>; closest?: (selector: string) => unknown };
    const otherInput = { checked: true };
    const confirm = { disabled: true };
    const modal = {
      querySelectorAll: (selector: string) => selector.startsWith(".character") ? [otherOption, selectedOption] : [otherInput, selectedInput],
      querySelector: (selector: string) => selector.includes("confirm-character") ? confirm : undefined,
    };
    selectedInput.dataset = { characterTransformationId: transformation.id };
    selectedInput.closest = (selector: string) => selector.includes("data-character-transformation-id") ? selectedInput : selector.includes("picker-modal") ? modal : selector.includes("option") ? selectedOption : undefined;
    const selected = selectedInput as unknown as HTMLElement;
    const render = vi.fn();
    const state = { characterTransformationPickerOpen: true, characterTransformationDetailOpen: false, characterTransformationRemoveOpen: false };

    expect(handleCharacterTransformationAction(selected, { state, character: demoCharacter, catalog, escapeHtml, saveCharacter: vi.fn(), render })).toBe(true);
    expect(state).toHaveProperty("characterTransformationSelectedId", transformation.id);
    expect(classes.has("is-selected")).toBe(true);
    expect(selectedInput.checked).toBe(true);
    expect(otherInput.checked).toBe(false);
    expect(confirm.disabled).toBe(false);
    expect(render).not.toHaveBeenCalled();
  });
});
