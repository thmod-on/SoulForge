import { describe, expect, it, vi } from "vitest";
import { demoCharacter } from "../../domain/demoCharacter";
import { createCustomResource } from "../../domain/customResources";
import { handleCustomResourceAction, renderRemoveCustomResourceModal, type CustomResourceUiState } from "./customResourceActions";

describe("remoção de recurso customizado", () => {
  it("apresenta nome, valor atual e confirmação destrutiva", () => {
    const custom = createCustomResource({ label: "Ímpeto", value: 2, max: 4, tone: "focus" }, "550e8400-e29b-41d4-a716-446655440000");
    const state = { character: { ...demoCharacter, resources: [...demoCharacter.resources, custom] }, deletingCustomResourceId: custom.id };
    const html = renderRemoveCustomResourceModal(state, (value) => value);

    expect(html).toContain("Remover recurso?");
    expect(html).toContain("Ímpeto");
    expect(html).toContain("2 / 4");
    expect(html).toContain('data-action="confirm-remove-custom-resource"');
  });

  it("não abre nem remove recursos protegidos", () => {
    const state: CustomResourceUiState = { character: structuredClone(demoCharacter) };
    const request = { dataset: { action: "request-remove-custom-resource", resourceId: "hp" } } as unknown as HTMLElement;
    const target = { closest: (selector: string) => selector === '[data-action="request-remove-custom-resource"]' ? request : null } as unknown as HTMLElement;

    handleCustomResourceAction(target, { state, escapeHtml: (value) => value, saveCharacter: vi.fn(), render: vi.fn() });
    expect(state.deletingCustomResourceId).toBeUndefined();
    expect(renderRemoveCustomResourceModal({ ...state, deletingCustomResourceId: "hp" }, (value) => value)).toBe("");
  });

  it("remove e persiste o recurso após a confirmação", async () => {
    const custom = createCustomResource({ label: "Ímpeto", value: 2, max: 4, tone: "focus" }, "550e8400-e29b-41d4-a716-446655440000");
    const state: CustomResourceUiState = { character: { ...demoCharacter, resources: [...demoCharacter.resources, custom] }, deletingCustomResourceId: custom.id };
    const confirmation = {} as HTMLElement;
    const target = { closest: (selector: string) => selector === '[data-action="confirm-remove-custom-resource"]' ? confirmation : null } as unknown as HTMLElement;
    const saveCharacter = vi.fn(async () => undefined);
    const render = vi.fn();

    handleCustomResourceAction(target, { state, escapeHtml: (value) => value, saveCharacter, render });
    await Promise.resolve();

    expect(state.character?.resources.some((resource) => resource.id === custom.id)).toBe(false);
    expect(state.deletingCustomResourceId).toBeUndefined();
    expect(saveCharacter).toHaveBeenCalledOnce();
    expect(render).toHaveBeenCalledOnce();
  });
});
