import { describe, expect, it } from "vitest";
import { createCatalog } from "../../domain/catalog";
import { demoCharacter } from "../../domain/demoCharacter";
import type { Character, Definition, PackBundle } from "../../domain/types";
import { analyzePackRemoval, analyzePackUpdate } from "./packUsage";

const packId = "pack.used";
const definitions: Definition[] = [
  { id: "class.used", type: "class", packId, name: "Classe", summary: "", domainIds: ["domain.used", "domain.other"], startingEvasion: 10, startingHitPoints: 6, featureIds: [], hopeFeatureId: "feature.used", subclassIds: ["subclass.used", "subclass.other"] },
  { id: "subclass.used", type: "subclass", packId, name: "Subclasse", summary: "", classId: "class.used", foundationFeatureIds: [], specializationFeatureIds: [], masteryFeatureIds: [] },
  { id: "domain.used", type: "domain", packId, name: "Domínio", summary: "", color: "#fff" },
  { id: "card.used", type: "card", packId, name: "Carta", summary: "", domainId: "domain.used", tier: 1, cardType: "acao", effect: "" },
  { id: "item.used", type: "item", packId, name: "Item", summary: "", category: "equipamento", weight: 1 },
  { id: "condition.used", type: "condition", packId, name: "Condição", summary: "", category: "standard", effect: "", clearing: "" },
  { id: "feature.used", type: "feature", packId, name: "Feature", summary: "", sourceType: "class", sourceId: "class.used", tier: "class" }
];

function character(): Character {
  return {
    ...demoCharacter,
    id: "character.used",
    identity: { ...demoCharacter.identity, name: "Aria", primaryClassId: "class.used", primarySubclassId: "subclass.used", primaryDomainIds: ["domain.used", "domain.other"] },
    deck: { activeCardIds: ["card.used"], learnedCardIds: ["card.used"] },
    inventory: { ...demoCharacter.inventory, entries: [{ definitionId: "item.used", quantity: 1 }] },
    activeConditions: [{ conditionId: "condition.used", fallbackName: "Condição", origins: [] }],
    activeFeatureEffects: [{ featureId: "feature.used", activatedAt: "2026-01-01" }],
    gameMarkers: [{ key: "feature.used:m", sourceDefinitionId: "feature.used", markerId: "m", kind: "counter", value: 1, max: 1 }],
    definitionSelections: [{ sourceDefinitionId: "feature.used", values: {} }]
  };
}

describe("impacto de Packs em fichas", () => {
  it("relata referências persistidas por ficha e categoria antes da remoção", () => {
    const impact = analyzePackRemoval([character()], createCatalog([{ id: packId, name: "Usado", version: "1", description: "" }], [...definitions]), [packId]);

    expect(impact.references.map((reference) => reference.kind)).toEqual(expect.arrayContaining(["Classe", "Subclasse", "Domínio", "Carta no Loadout", "Item no inventário", "Condição ativa", "Feature ativa", "Marcador", "Escolha de Feature"]));
    expect(impact.references.every((reference) => reference.characterName === "Aria")).toBe(true);
  });

  it("distingue Definitions removidas de Definitions apenas alteradas numa atualização", () => {
    const current = createCatalog([{ id: packId, name: "Usado", version: "1", description: "" }], [...definitions]);
    const next: PackBundle = { format: "soulforge-pack-v1", manifest: { id: packId, name: "Usado", version: "2", description: "" }, definitions: [{ ...definitions[0], summary: "Alterada" }] };
    const impact = analyzePackUpdate([character()], current, [next]);

    expect(impact.removedDefinitionIds).toContain("card.used");
    expect(impact.changedDefinitionIds).toContain("class.used");
    expect(impact.references.some((reference) => reference.definitionId === "card.used")).toBe(true);
    expect(impact.references.some((reference) => reference.definitionId === "class.used")).toBe(false);
  });
});
