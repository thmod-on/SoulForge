import { describe, expect, it } from "vitest";
import { demoCharacter } from "../../domain/demoCharacter";
import type { ConditionDefinition } from "../../domain/types";
import { addSceneCondition, removeSceneConditionOrigin, synchronizeCharacterConditions, vulnerableConditionId } from "./characterConditions";

const vulnerable: ConditionDefinition = {
  id: vulnerableConditionId,
  type: "condition",
  packId: "test",
  name: "Vulnerável",
  summary: "A criatura está exposta.",
  category: "standard",
  effect: "Rolagens contra ela têm vantagem.",
  clearing: "Limpe Estresse."
};

describe("condições ativas da ficha", () => {
  it("aplica Vulnerável ao preencher Estresse e remove somente a origem automática ao limpar", () => {
    const fullStress = { ...demoCharacter, resources: demoCharacter.resources.map((resource) => resource.id === "stress" ? { ...resource, value: resource.max } : resource) };
    const vulnerableByStress = synchronizeCharacterConditions(fullStress);
    expect(vulnerableByStress.activeConditions).toMatchObject([{ conditionId: vulnerableConditionId, origins: [{ kind: "stress" }] }]);

    const alsoFromScene = addSceneCondition(vulnerableByStress, vulnerable, "Ataque do Guardião");
    const clearedStress = synchronizeCharacterConditions({ ...alsoFromScene, resources: alsoFromScene.resources.map((resource) => resource.id === "stress" ? { ...resource, value: resource.max - 1 } : resource) });
    expect(clearedStress.activeConditions).toMatchObject([{ conditionId: vulnerableConditionId, origins: [{ kind: "scene", label: "Ataque do Guardião" }] }]);
  });

  it("não duplica a origem de cena e remove apenas a origem solicitada", () => {
    const applied = addSceneCondition(demoCharacter, vulnerable, "Maldição da cena");
    const repeated = addSceneCondition(applied, vulnerable, "Outra origem");
    expect(repeated.activeConditions?.[0].origins).toHaveLength(1);

    const originId = repeated.activeConditions?.[0].origins[0].id!;
    expect(removeSceneConditionOrigin(repeated, vulnerable.id, originId).activeConditions).toEqual([]);
  });

  it("preserva a referência por nome quando a Definition não está mais disponível", () => {
    const applied = addSceneCondition(demoCharacter, vulnerable, "Cena");
    expect(applied.activeConditions?.[0]).toMatchObject({ conditionId: vulnerable.id, fallbackName: "Vulnerável" });
  });
});
