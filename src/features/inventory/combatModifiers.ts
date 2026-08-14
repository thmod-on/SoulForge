import type { Character, Defense, ItemDefinition } from "../../domain/types";

/** Calcula os valores exibidos na ficha sem alterar a defesa-base persistida. */
export function getEffectiveDefense(character: Character, findItem: (id: string) => ItemDefinition | undefined): Defense {
  // Os limiares acompanham o nível atual do personagem e recebem, depois,
  // quaisquer bônus ou penalidades declarados nos itens equipados.
  const baseDefense: Defense = {
    ...character.defense,
    minor: character.defense.minor + character.identity.level,
    major: character.defense.major + character.identity.level
  };
  return character.inventory.entries
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
}

/** Mantém os slots de Armadura alinhados à armadura atualmente equipada. */
export function synchronizeArmorResource(character: Character, findItem: (id: string) => ItemDefinition | undefined): Character {
  const armorSlots = character.inventory.entries
    .filter((entry) => (entry.compartmentId ?? (entry.equipped ? "equipped" : "backpack")) === "equipped")
    .reduce((total, entry) => {
      const item = findItem(entry.definitionId);
      return item?.category === "armadura" ? total + (item.combatModifiers?.armor ?? 0) * entry.quantity : total;
    }, 0);
  const resourceIndex = character.resources.findIndex((resource) => resource.id === "armor-slots");
  if (resourceIndex < 0) return character;

  const current = character.resources[resourceIndex];
  // Uma nova quantidade de slots representa uma armadura diferente (ou a
  // remoção dela); nesse caso, a trilha inicia com todos os slots disponíveis.
  // Se a mesma armadura continuar equipada, marcas já usadas são preservadas.
  const value = current.max === armorSlots ? Math.min(current.value, armorSlots) : armorSlots;
  if (current.label === "Armadura" && current.max === armorSlots && current.value === value) return character;

  return {
    ...character,
    resources: character.resources.map((resource, index) => index === resourceIndex
      ? { ...resource, label: "Armadura", max: armorSlots, value }
      : resource)
  };
}
