import { describe, expect, it } from "vitest";
import { assignCreationAttributeValue, createEmptyCreationAttributeValues, getRemainingCreationAttributeValues, handleCreationAttributeAllocation, selectCreationAttributeValue } from "./attributeAllocation";

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

  it("atribui somente valores disponíveis e libera um atributo ao tocar nele sem ficha selecionada", () => {
    const initial = createEmptyCreationAttributeValues();
    const selected = selectCreationAttributeValue(initial, 2);
    const assigned = assignCreationAttributeValue(initial, "dex", selected).values;

    expect(assigned.dex).toBe(2);
    expect(selectCreationAttributeValue(assigned, 2)).toBeUndefined();
    expect(assignCreationAttributeValue(assigned, "dex").values.dex).toBeNaN();
  });

  it("mantém a interação por toque no domínio da distribuição", () => {
    const selected = handleCreationAttributeAllocation({ values: createEmptyCreationAttributeValues(), action: "select", value: 1 });
    const assigned = handleCreationAttributeAllocation({ values: selected.values, selectedValue: selected.selectedValue, action: "assign", attributeId: "wil" });

    expect(assigned.values.wil).toBe(1);
    expect(assigned.selectedValue).toBeUndefined();
  });
});
