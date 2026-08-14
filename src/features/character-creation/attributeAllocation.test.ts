import { describe, expect, it } from "vitest";
import { createEmptyCreationAttributeValues, getRemainingCreationAttributeValues } from "./attributeAllocation";

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
});
