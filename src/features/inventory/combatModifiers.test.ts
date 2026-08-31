import { describe, expect, it } from "vitest";
import { getEffectiveDefense, synchronizeArmorResource } from "./combatModifiers";
import type { Character, ItemDefinition } from "../../domain/types";

const character: Character = {
  id: "character.test",
  identity: { name: "Teste", ancestry: "Humano", className: "Guardião", community: "Teste", level: 1, xp: 0, nextLevelXp: 10, quote: "" },
  attributes: [],
  defense: { evasion: 10, armor: 0, minor: 5, major: 10 },
  proficiency: 1,
  resources: [], skills: [], experiences: [], notes: [], deck: { activeCardIds: [], learnedCardIds: [] },
  inventory: { capacity: 10, compartments: [], entries: [{ definitionId: "item.armor", quantity: 1, compartmentId: "equipped" }, { definitionId: "item.ring", quantity: 1, compartmentId: "backpack" }] }
};

const armor: ItemDefinition = { id: "item.armor", type: "item", packId: "test", name: "Armadura", summary: "", category: "armadura", weight: 1, combatModifiers: { armor: 2, minor: 1, major: 2, evasion: -1 } };
const shield: ItemDefinition = { id: "item.shield", type: "item", packId: "test", name: "Escudo", summary: "", category: "equipamento", weight: 1, combatModifiers: { armor: 1 } };

describe("getEffectiveDefense", () => {
  it("aplica somente modificadores de itens equipados", () => {
    expect(getEffectiveDefense(character, (id) => id === armor.id ? armor : undefined)).toEqual({ evasion: 9, armor: 2, minor: 7, major: 13 });
  });

  it("usa nível e o dobro do nível nos limiares quando não há Armadura", () => {
    const levelFourCharacter = { ...character, identity: { ...character.identity, level: 4 }, inventory: { ...character.inventory, entries: [] } };
    expect(getEffectiveDefense(levelFourCharacter, () => undefined)).toEqual({ evasion: 10, armor: 0, minor: 4, major: 8 });
  });

  it("sincroniza os slots de Armadura com todos os itens equipados que concedem Armadura", () => {
    const characterWithArmorResource: Character = {
      ...character,
      resources: [{ id: "armor-slots", label: "Armadura", value: 0, max: 6, tone: "focus" }],
      inventory: { ...character.inventory, entries: [...character.inventory.entries, { definitionId: "item.shield", quantity: 1, compartmentId: "equipped" }] }
    };
    const synchronized = synchronizeArmorResource(characterWithArmorResource, (id) => id === armor.id ? armor : id === shield.id ? shield : undefined);

    expect(synchronized.resources[0]).toMatchObject({ value: 0, max: 3 });
  });
});
