import { describe, expect, it } from "vitest";
import {
  assignCreationAttributeValue,
  characterCreationAttributes,
  createEmptyCreationAttributeValues,
  getRemainingCreationAttributeTokens,
  getRemainingCreationAttributeValues,
  handleCreationAttributeAllocation,
  normalizeCreationAttributeTokenAssignments
} from "./attributeAllocation";

describe("distribuição inicial de atributos", () => {
  it("oferece todos os valores antes de qualquer escolha", () => {
    expect(getRemainingCreationAttributeValues(createEmptyCreationAttributeValues())).toEqual([-1, 0, 0, 1, 1, 2]);
  });

  it("remove apenas o valor usado pelos outros atributos", () => {
    const values = createEmptyCreationAttributeValues();
    values.dex = 2;
    values.for = 1;

    expect(getRemainingCreationAttributeValues(values)).toEqual([-1, 0, 0, 1]);
    expect(getRemainingCreationAttributeValues(values, "dex")).toEqual([-1, 0, 0, 1, 2]);
  });

  it("não remove um valor quando nenhuma pedra foi informada", () => {
    const values = createEmptyCreationAttributeValues();
    values.dex = 2;

    const result = assignCreationAttributeValue(values, "dex");

    expect(result.values.dex).toBe(2);
    expect(result.error).toBe("Escolha um valor disponível para este atributo.");
  });

  it("ativa o atributo antes de aceitar uma pedra e mantém o seletor aberto", () => {
    const values = createEmptyCreationAttributeValues();
    const inactive = handleCreationAttributeAllocation({ values, action: "assign-token", tokenId: "attribute-token-5" });
    expect(inactive.error).toBe("Escolha primeiro o atributo que deseja preencher.");

    const active = handleCreationAttributeAllocation({ values, action: "activate", attributeId: "dex" });
    const assigned = handleCreationAttributeAllocation({ ...active, action: "assign-token", tokenId: "attribute-token-5" });

    expect(assigned.values.dex).toBe(2);
    expect(assigned.activeAttributeId).toBe("dex");
    expect(assigned.assignedTokenIds.dex).toBe("attribute-token-5");
  });

  it("mantém pedras de mesmo valor como alvos independentes durante trocas", () => {
    const tokens = getRemainingCreationAttributeTokens(createEmptyCreationAttributeValues());
    const zeros = tokens.filter((token) => token.value === 0);
    expect(zeros.map((token) => token.id)).toEqual(["attribute-token-1", "attribute-token-2"]);

    const active = handleCreationAttributeAllocation({ values: createEmptyCreationAttributeValues(), action: "activate", attributeId: "for" });
    const first = handleCreationAttributeAllocation({ ...active, action: "assign-token", tokenId: zeros[1].id });
    const changed = handleCreationAttributeAllocation({ ...first, action: "assign-token", tokenId: zeros[0].id });

    expect(first.assignedTokenIds.for).toBe("attribute-token-2");
    expect(changed.assignedTokenIds.for).toBe("attribute-token-1");
    expect(changed.values.for).toBe(0);
  });

  it("não apaga ao tocar novamente no valor atual", () => {
    const active = handleCreationAttributeAllocation({ values: createEmptyCreationAttributeValues(), action: "activate", attributeId: "wil" });
    const assigned = handleCreationAttributeAllocation({ ...active, action: "assign-token", tokenId: "attribute-token-3" });
    const repeated = handleCreationAttributeAllocation({ ...assigned, action: "assign-token", tokenId: "attribute-token-3" });

    expect(repeated.values.wil).toBe(1);
    expect(repeated.assignedTokenIds.wil).toBe("attribute-token-3");
  });

  it("libera somente pela ação explícita e preserva o atributo ativo", () => {
    const active = handleCreationAttributeAllocation({ values: createEmptyCreationAttributeValues(), action: "activate", attributeId: "cha" });
    const assigned = handleCreationAttributeAllocation({ ...active, action: "assign-token", tokenId: "attribute-token-0" });
    const released = handleCreationAttributeAllocation({ ...assigned, action: "release" });

    expect(released.values.cha).toBeNaN();
    expect(released.assignedTokenIds.cha).toBeUndefined();
    expect(released.activeAttributeId).toBe("cha");
  });

  it("impede que dois atributos possuam a mesma pedra", () => {
    const firstActive = handleCreationAttributeAllocation({ values: createEmptyCreationAttributeValues(), action: "activate", attributeId: "dex" });
    const firstAssigned = handleCreationAttributeAllocation({ ...firstActive, action: "assign-token", tokenId: "attribute-token-4" });
    const secondActive = handleCreationAttributeAllocation({ ...firstAssigned, action: "activate", attributeId: "con" });
    const duplicated = handleCreationAttributeAllocation({ ...secondActive, action: "assign-token", tokenId: "attribute-token-4" });

    expect(duplicated.error).toBe("Essa pedra já está encaixada em outro atributo.");
    expect(duplicated.values.dex).toBe(1);
    expect(duplicated.values.con).toBeNaN();
  });

  it("distribui o conjunto completo sem perder identidades ao trocar rapidamente de atributo", () => {
    let state = handleCreationAttributeAllocation({ values: createEmptyCreationAttributeValues(), action: "activate", attributeId: characterCreationAttributes[0].id });
    characterCreationAttributes.forEach((attribute, index) => {
      state = handleCreationAttributeAllocation({ ...state, action: "activate", attributeId: attribute.id });
      state = handleCreationAttributeAllocation({ ...state, action: "assign-token", tokenId: `attribute-token-${index}` });
    });

    expect(Object.values(state.values).sort((a, b) => a - b)).toEqual([-1, 0, 0, 1, 1, 2]);
    expect(new Set(Object.values(state.assignedTokenIds)).size).toBe(6);
    expect(state.activeAttributeId).toBe("int");
  });

  it("reconstrói identidades ausentes, fecha o seletor e reinicia a distribuição", () => {
    const values = createEmptyCreationAttributeValues();
    values.dex = 0;
    values.for = 0;
    const normalized = normalizeCreationAttributeTokenAssignments(values);
    expect(normalized).toEqual({ dex: "attribute-token-1", for: "attribute-token-2" });

    const closed = handleCreationAttributeAllocation({ values, activeAttributeId: "dex", assignedTokenIds: normalized, action: "close" });
    expect(closed.activeAttributeId).toBeUndefined();

    const reset = handleCreationAttributeAllocation({ ...closed, action: "reset" });
    expect(Object.values(reset.values).every(Number.isNaN)).toBe(true);
    expect(reset.assignedTokenIds).toEqual({});
  });
});
