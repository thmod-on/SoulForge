import { describe, expect, it } from "vitest";
import { createCatalog } from "../../domain/catalog";
import type { Character, ItemDefinition } from "../../domain/types";
import { canAddItemToCompartment, getCompartmentWeight, getInventoryCompartments, getInventoryItemEntries, wouldFitCompartment } from "./inventoryModel";

const item: ItemDefinition = { id: "item.test", type: "item", packId: "pack.test", name: "Item", summary: "", category: "equipamento", weight: 2 };
const catalog = createCatalog([], [item]);
const character = {
  inventory: { capacity: 10, compartments: [{ id: "bag", name: "Bolsa", capacity: 5, source: "custom" as const }], entries: [{ definitionId: item.id, quantity: 2, compartmentId: "bag" }] }
} as Character;

describe("modelo do inventário", () => {
  it("resolve Definitions e calcula o peso por compartimento", () => {
    const entries = getInventoryItemEntries(character, catalog);
    expect(entries).toHaveLength(1);
    expect(getCompartmentWeight(entries, "bag")).toBe(4);
  });

  it("aplica capacidade ao adicionar e permite manter itens no compartimento atual", () => {
    const entries = getInventoryItemEntries(character, catalog);
    const compartment = getInventoryCompartments(character)[0];
    expect(canAddItemToCompartment(compartment, entries, item, 1)).toBe(false);
    expect(wouldFitCompartment(compartment, entries, item, 2, "bag")).toBe(true);
  });
});
