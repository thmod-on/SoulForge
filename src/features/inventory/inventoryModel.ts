import type { Catalog } from "../../domain/catalog";
import type { Character, InventoryCompartment, ItemDefinition } from "../../domain/types";

export type InventoryItemEntry = { entry: Character["inventory"]["entries"][number]; item: ItemDefinition };

export function getInventoryItemEntries(character: Character, catalog: Catalog): InventoryItemEntry[] {
  return character.inventory.entries
    .map((entry) => {
      const definition = catalog.definitions.find((candidate) => candidate.id === entry.definitionId);
      return definition?.type === "item" ? { entry, item: definition } : undefined;
    })
    .filter((entry): entry is InventoryItemEntry => Boolean(entry));
}

export function getInventoryCompartments(character: Character): InventoryCompartment[] {
  return character.inventory.compartments?.length
    ? character.inventory.compartments
    : [
        { id: "equipped", name: "Equipados", source: "character" },
        { id: "backpack", name: "Mochila", capacity: character.inventory.capacity, source: "character" }
      ];
}

export function getEntryCompartmentId(entry: Character["inventory"]["entries"][number]): string {
  return entry.compartmentId ?? (entry.equipped ? "equipped" : "backpack");
}

export function getCompartmentWeight(entries: InventoryItemEntry[], compartmentId: string): number {
  return entries.filter(({ entry }) => getEntryCompartmentId(entry) === compartmentId).reduce((total, { entry, item }) => total + entry.quantity * item.weight, 0);
}

export function canCompartmentAcceptItem(compartment: InventoryCompartment, item: ItemDefinition): boolean {
  return !compartment.accepts?.length || compartment.accepts.includes(item.category);
}

export function wouldFitCompartment(compartment: InventoryCompartment, entries: InventoryItemEntry[], item: ItemDefinition, quantity: number, currentCompartmentId: string): boolean {
  if (!compartment.capacity || compartment.id === currentCompartmentId) return true;
  return getCompartmentWeight(entries, compartment.id) + item.weight * quantity <= compartment.capacity;
}

export function canAddItemToCompartment(compartment: InventoryCompartment, entries: InventoryItemEntry[], item: ItemDefinition, quantity: number): boolean {
  return canCompartmentAcceptItem(compartment, item) && (!compartment.capacity || getCompartmentWeight(entries, compartment.id) + item.weight * quantity <= compartment.capacity);
}
