import { describe, expect, it, vi } from "vitest";
import { createCatalog } from "../../domain/catalog";
import { demoCharacter } from "../../domain/demoCharacter";
import type { FeatureDefinition } from "../../domain/types";
import { handleRestAction, type RestActionState } from "./restActions";

const trance: FeatureDefinition = {
  id: "feature.test.elf.bottom",
  type: "feature",
  packId: "test",
  name: "Transe Celestial",
  summary: "Um movimento adicional.",
  sourceType: "ancestry",
  sourceId: "ancestry.test.elf",
  tier: "bottom",
  sheetModifiers: [{ kind: "rest-move-bonus", amount: 1 }]
};

function moveTarget(move: string): HTMLElement {
  const choice = { dataset: { restMove: move } };
  return { closest: (selector: string) => selector.includes("choose-rest-move") ? choice : undefined } as unknown as HTMLElement;
}

function actionTarget(action: string): HTMLElement {
  const element = {};
  return { closest: (selector: string) => selector.includes(`data-action="${action}"`) ? element : undefined } as unknown as HTMLElement;
}

describe("rest actions", () => {
  it("permite o terceiro movimento concedido pela Feature e bloqueia o quarto", () => {
    const character = { ...demoCharacter, identity: { ...demoCharacter.identity, ancestryFeatureIds: { bottom: trance.id } } };
    const state: RestActionState = { character, restDialogKind: "short", restChoices: [{ id: "prepare" }, { id: "clear-stress", roll: 2 }] };
    const dependencies = { catalog: createCatalog([], [trance]), saveCharacter: vi.fn(), render: vi.fn() };

    expect(handleRestAction(moveTarget("repair-armor"), state, dependencies)).toBe(true);
    expect(state.restChoices).toHaveLength(3);
    expect(handleRestAction(moveTarget("tend-wounds"), state, dependencies)).toBe(true);
    expect(state.restChoices).toHaveLength(3);
    expect(dependencies.render).toHaveBeenCalledTimes(1);
  });

  it("conclui o descanso somente quando o limite ampliado estiver preenchido", async () => {
    const character = { ...demoCharacter, identity: { ...demoCharacter.identity, ancestryFeatureIds: { bottom: trance.id } } };
    const saveCharacter = vi.fn(async () => undefined);
    const dependencies = { catalog: createCatalog([], [trance]), saveCharacter, render: vi.fn() };
    const state: RestActionState = { character, restDialogKind: "long", restChoices: [{ id: "prepare" }, { id: "clear-stress" }] };

    expect(handleRestAction(actionTarget("confirm-rest"), state, dependencies)).toBe(true);
    await Promise.resolve();
    expect(saveCharacter).not.toHaveBeenCalled();

    state.restChoices.push({ id: "repair-armor" });
    expect(handleRestAction(actionTarget("confirm-rest"), state, dependencies)).toBe(true);
    await vi.waitFor(() => expect(saveCharacter).toHaveBeenCalledOnce());
    expect(state.restDialogKind).toBeUndefined();
  });
});
