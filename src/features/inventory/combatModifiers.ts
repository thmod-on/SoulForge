import type { Catalog } from "../../domain/catalog";
import type { Character, Defense, ItemDefinition } from "../../domain/types";
import { sumDerivedDefense } from "../items/derivedDefense";

/** Calcula os valores exibidos na ficha sem alterar a defesa-base persistida. */
export function getEffectiveDefense(character: Character, findItem: (id: string) => ItemDefinition | undefined, activeFeatureModifiers: Partial<Defense> = {}, catalog?: Pick<Catalog, "subclasses">): Defense {
  const equippedItems = character.inventory.entries
    .filter((entry) => (entry.compartmentId ?? (entry.equipped ? "equipped" : "backpack")) === "equipped");
  const hasArmor = equippedItems.some((entry) => (findItem(entry.definitionId)?.combatModifiers?.armor ?? 0) * entry.quantity > 0);
  // Sem Armadura, os limiares básicos são nível e o dobro do nível. Com
  // Armadura, preservamos a base da ficha, o nível e os bônus equipados.
  const baseDefense: Defense = {
    ...character.defense,
    minor: hasArmor ? character.defense.minor + character.identity.level : character.identity.level,
    major: hasArmor ? character.defense.major + character.identity.level : character.identity.level * 2
  };
  const defenseWithItems = equippedItems
    .reduce<Defense>((defense, entry) => {
      const item = findItem(entry.definitionId);
      const modifiers = item?.combatModifiers;
      const derived = sumDerivedDefense(item?.derivedDefenseModifiers, character, catalog).defense;
      return item
        ? {
            evasion: defense.evasion + ((modifiers?.evasion ?? 0) + (derived.evasion ?? 0)) * entry.quantity,
            armor: defense.armor + ((modifiers?.armor ?? 0) + (derived.armor ?? 0)) * entry.quantity,
            minor: defense.minor + ((modifiers?.minor ?? 0) + (derived.minor ?? 0)) * entry.quantity,
            major: defense.major + ((modifiers?.major ?? 0) + (derived.major ?? 0)) * entry.quantity
          }
        : defense;
    }, baseDefense);
  return {
    evasion: defenseWithItems.evasion + (activeFeatureModifiers.evasion ?? 0),
    armor: defenseWithItems.armor + (activeFeatureModifiers.armor ?? 0),
    minor: defenseWithItems.minor + (activeFeatureModifiers.minor ?? 0),
    major: defenseWithItems.major + (activeFeatureModifiers.major ?? 0)
  };
}

/** Mantém os slots de Armadura alinhados a todos os bônus de armadura equipados. */
export function synchronizeArmorResource(character: Character, findItem: (id: string) => ItemDefinition | undefined): Character {
  const armorSlots = character.inventory.entries
    .filter((entry) => (entry.compartmentId ?? (entry.equipped ? "equipped" : "backpack")) === "equipped")
    .reduce((total, entry) => {
      const item = findItem(entry.definitionId);
      // Um escudo, acessório ou qualquer outro item equipado também pode
      // declarar Armadura. A categoria do item não altera esse efeito.
      return total + (item?.combatModifiers?.armor ?? 0) * entry.quantity;
    }, 0);
  const resourceIndex = character.resources.findIndex((resource) => resource.id === "armor-slots");
  if (resourceIndex < 0) return character;

  const current = character.resources[resourceIndex];
  const previousBaseMax = current.baseMax ?? current.max;
  // A trilha registra slots marcados. Ao equipar ou trocar itens, preservamos
  // apenas as marcas que ainda cabem na nova quantidade de slots.
  const effectBonus = Math.max(0, current.max - previousBaseMax);
  const value = Math.min(current.value, armorSlots + effectBonus);
  if (current.label === "Armadura" && current.baseMax === armorSlots && current.value === value) return character;

  return {
    ...character,
    resources: character.resources.map((resource, index) => index === resourceIndex
      ? { ...resource, label: "Armadura", baseMax: armorSlots, max: armorSlots, value }
      : resource)
  };
}
