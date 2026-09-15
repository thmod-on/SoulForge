import { describe, expect, it } from "vitest";
import type { ConditionDefinition } from "../domain/types";
import { getConditionArtwork } from "./conditionArtwork";

const condition: ConditionDefinition = {
  id: "condition.core.hidden", type: "condition", packId: "test", name: "Oculto", summary: "Fora de vista.",
  category: "standard", effect: "Rolagens contra a criatura têm desvantagem.", clearing: "Termina quando a criatura é vista."
};

describe("getConditionArtwork", () => {
  it.each([
    ["condition.core.hidden", "hidden.jpg"],
    ["condition.core.restrained", "restrained.jpg"],
    ["condition.core.vulnerable", "vulnerable.jpg"]
  ])("associa a arte autoral de %s pelo ID exato", (id, file) => {
    expect(getConditionArtwork({ ...condition, id })).toContain(`assets/conditions/generic/${file}`);
  });

  it("preserva a imagem fornecida pela Definition", () => {
    expect(getConditionArtwork({ ...condition, image: "custom-condition.webp" })).toBe("custom-condition.webp");
  });

  it("não associa arte por nome ou correspondência parcial", () => {
    expect(getConditionArtwork({ ...condition, id: "condition.local.hidden" })).toBeUndefined();
  });
});
