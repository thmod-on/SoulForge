import { describe, expect, it } from "vitest";
import { getEffectiveDefense, synchronizeArmorResource } from "./combatModifiers";
import type { Character, ItemDefinition } from "../../domain/types";
import { createCatalog } from "../../domain/catalog";

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

  it("combina limiares fixos, nível e atributo de Conjuração", () => {
    const robes: ItemDefinition = { id: "item.robes", type: "item", packId: "test", name: "Vestes", summary: "", category: "armadura", weight: 0, combatModifiers: { armor: 5, minor: 10, major: 31 }, derivedDefenseModifiers: [{ field: "minor", source: { kind: "spellcast-attribute" } }, { field: "major", source: { kind: "spellcast-attribute" } }] };
    const subclass = { id: "subclass.test", type: "subclass" as const, packId: "test", name: "Mago", summary: "", classId: "class.test", foundationFeatureIds: [], specializationFeatureIds: [], masteryFeatureIds: [], spellcastAttributeId: "int" as const };
    const levelFive: Character = { ...character, identity: { ...character.identity, level: 5, primarySubclassId: subclass.id }, attributes: [{ id: "int", label: "CON", value: 2 }], defense: { evasion: 10, armor: 0, minor: 0, major: 0 }, inventory: { ...character.inventory, entries: [{ definitionId: robes.id, quantity: 1, compartmentId: "equipped" }] } };
    expect(getEffectiveDefense(levelFive, (id) => id === robes.id ? robes : undefined, {}, createCatalog([], [subclass]))).toEqual({ evasion: 10, armor: 5, minor: 17, major: 38 });
  });

  it("não aplica parcela derivada de item guardado na mochila", () => {
    const charm: ItemDefinition = { id: "item.charm", type: "item", packId: "test", name: "Amuleto", summary: "", category: "equipamento", weight: 0, derivedDefenseModifiers: [{ field: "evasion", source: { kind: "character-level" } }] };
    const stored = { ...character, inventory: { ...character.inventory, entries: [{ definitionId: charm.id, quantity: 1, compartmentId: "backpack" }] } };
    expect(getEffectiveDefense(stored, () => charm)).toEqual({ evasion: 10, armor: 0, minor: 1, major: 2 });
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
