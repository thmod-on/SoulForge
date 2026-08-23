import type { Character, Defense, ItemDefinition } from "../../domain/types";

/** Calcula os valores exibidos na ficha sem alterar a defesa-base persistida. */
export function getEffectiveDefense(character: Character, findItem: (id: string) => ItemDefinition | undefined, activeFeatureModifiers: Partial<Defense> = {}): Defense {
  // Os limiares acompanham o nível atual do personagem e recebem, depois,
  // quaisquer bônus ou penalidades declarados nos itens equipados.
  const baseDefense: Defense = {
    ...character.defense,
    minor: character.defense.minor + character.identity.level,
    major: character.defense.major + character.identity.level
  };
  const defenseWithItems = character.inventory.entries
    .filter((entry) => (entry.compartmentId ?? (entry.equipped ? "equipped" : "backpack")) === "equipped")
    .reduce<Defense>((defense, entry) => {
      const modifiers = findItem(entry.definitionId)?.combatModifiers;
      return modifiers
        ? {
            evasion: defense.evasion + (modifiers.evasion ?? 0) * entry.quantity,
            armor: defense.armor + (modifiers.armor ?? 0) * entry.quantity,
            minor: defense.minor + (modifiers.minor ?? 0) * entry.quantity,
            major: defense.major + (modifiers.major ?? 0) * entry.quantity
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
  // Uma nova quantidade de slots representa uma armadura diferente (ou a
  // remoção dela); nesse caso, a trilha inicia com todos os slots disponíveis.
  // Se a mesma armadura continuar equipada, marcas já usadas são preservadas.
  const effectBonus = Math.max(0, current.max - previousBaseMax);
  const value = previousBaseMax === armorSlots ? Math.min(current.value, armorSlots + effectBonus) : armorSlots + effectBonus;
  if (current.label === "Armadura" && current.baseMax === armorSlots && current.value === value) return character;

  return {
    ...character,
    resources: character.resources.map((resource, index) => index === resourceIndex
      ? { ...resource, label: "Armadura", baseMax: armorSlots, max: armorSlots, value }
      : resource)
  };
}
