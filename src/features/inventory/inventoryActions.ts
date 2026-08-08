import type { Character, InventoryCompartment, ItemDefinition } from "../../domain/types";

type InventoryItemEntry = { entry: Character["inventory"]["entries"][number]; item: ItemDefinition };

export type InventoryActionState = {
  character?: Character;
  selectedItemId?: string;
  addItemToCompartmentId?: string;
  addingDefinitionItemId?: string;
  addItemCatalogFilter: "todos" | ItemDefinition["category"];
  addItemError?: string;
  addContainerOpen: boolean;
  deleteContainerId?: string;
  deletingItemId?: string;
};

export type InventoryActionDependencies = {
  state: InventoryActionState;
  getItemEntries: (character: Character) => InventoryItemEntry[];
  getInventoryCompartments: (character: Character) => InventoryCompartment[];
  getEntryCompartmentId: (entry: InventoryItemEntry["entry"]) => string;
  canCompartmentAcceptItem: (compartment: InventoryCompartment, item: ItemDefinition) => boolean;
  wouldFitCompartment: (compartment: InventoryCompartment, entries: InventoryItemEntry[], item: ItemDefinition, quantity: number, currentCompartmentId: string) => boolean;
  canAddItemToCompartment: (compartment: InventoryCompartment, entries: InventoryItemEntry[], item: ItemDefinition, quantity: number) => boolean;
  findItem: (definitionId: string) => ItemDefinition | undefined;
  saveCharacter: (character: Character) => Promise<void>;
  render: (options?: { preserveMainScroll?: boolean }) => void;
};

export async function moveItemToCompartment(itemId: string | undefined, targetCompartmentId: string | undefined, sourceCompartmentId: string | undefined, dependencies: InventoryActionDependencies): Promise<void> {
  const { state, getItemEntries, getInventoryCompartments, getEntryCompartmentId, canCompartmentAcceptItem, wouldFitCompartment, saveCharacter, render } = dependencies;
  const character = state.character;
  if (!character || !itemId || !targetCompartmentId) return;
  const entries = getItemEntries(character);
  const targetEntry = entries.find(({ item, entry }) => item.id === itemId && (!sourceCompartmentId || getEntryCompartmentId(entry) === sourceCompartmentId));
  const targetCompartment = getInventoryCompartments(character).find((compartment) => compartment.id === targetCompartmentId);
  if (!targetEntry || !targetCompartment) return;
  const currentCompartmentId = getEntryCompartmentId(targetEntry.entry);
  if (!canCompartmentAcceptItem(targetCompartment, targetEntry.item) || !wouldFitCompartment(targetCompartment, entries, targetEntry.item, targetEntry.entry.quantity, currentCompartmentId)) return;
  const updatedCharacter: Character = { ...character, inventory: { ...character.inventory, entries: character.inventory.entries.map((entry) => entry.definitionId === itemId && getEntryCompartmentId(entry) === currentCompartmentId ? { ...entry, compartmentId: targetCompartmentId, equipped: targetCompartmentId === "equipped" } : entry) } };
  state.character = updatedCharacter;
  await saveCharacter(updatedCharacter);
  render({ preserveMainScroll: true });
}

export async function addItemToContainer(dependencies: InventoryActionDependencies): Promise<void> {
  const { state, getItemEntries, getInventoryCompartments, getEntryCompartmentId, canAddItemToCompartment, findItem, saveCharacter, render } = dependencies;
  const character = state.character;
  const compartmentId = state.addItemToCompartmentId;
  const definitionId = state.addingDefinitionItemId;
  const quantity = Number(document.querySelector<HTMLInputElement>("[data-add-item-quantity]")?.value ?? 0);
  if (!character || !compartmentId || !definitionId || !Number.isInteger(quantity) || quantity < 1) {
    state.addItemError = "Informe uma quantidade inteira maior que zero.";
    render();
    return;
  }
  const definition = findItem(definitionId);
  const compartment = getInventoryCompartments(character).find((entry) => entry.id === compartmentId);
  const entries = getItemEntries(character);
  if (!definition || !compartment || !canAddItemToCompartment(compartment, entries, definition, quantity)) {
    state.addItemError = "Este item nao cabe no container com a quantidade informada.";
    render();
    return;
  }
  const existingEntry = character.inventory.entries.find((entry) => entry.definitionId === definition.id && getEntryCompartmentId(entry) === compartmentId);
  const updatedEntries = existingEntry ? character.inventory.entries.map((entry) => entry === existingEntry ? { ...entry, quantity: entry.quantity + quantity } : entry) : [...character.inventory.entries, { definitionId: definition.id, quantity, compartmentId, equipped: compartmentId === "equipped" }];
  const updatedCharacter: Character = { ...character, inventory: { ...character.inventory, entries: updatedEntries } };
  state.character = updatedCharacter;
  state.addItemToCompartmentId = undefined;
  state.addingDefinitionItemId = undefined;
  state.addItemCatalogFilter = "todos";
  state.addItemError = undefined;
  await saveCharacter(updatedCharacter);
  render();
}

export async function createInventoryContainer(dependencies: InventoryActionDependencies): Promise<void> {
  const { state, getInventoryCompartments, saveCharacter, render } = dependencies;
  const character = state.character;
  if (!character) return;
  const nameInput = document.querySelector<HTMLInputElement>("[data-container-name]");
  const capacityInput = document.querySelector<HTMLInputElement>("[data-container-capacity]");
  const acceptInputs = Array.from(document.querySelectorAll<HTMLInputElement>("[data-container-accepts]:checked"));
  const name = nameInput?.value.trim();
  const capacity = Number(capacityInput?.value);
  if (!name || !Number.isFinite(capacity) || capacity <= 0) {
    const error = document.querySelector<HTMLElement>("[data-container-error]");
    error?.removeAttribute("hidden");
    if (error) error.textContent = "Informe um nome e uma capacidade maior que zero.";
    nameInput?.classList.toggle("is-invalid", !name);
    capacityInput?.classList.toggle("is-invalid", !Number.isFinite(capacity) || capacity <= 0);
    (!name ? nameInput : capacityInput)?.focus();
    return;
  }
  const accepts = acceptInputs.map((input) => input.value as ItemDefinition["category"]);
  const updatedCharacter: Character = { ...character, inventory: { ...character.inventory, compartments: [...getInventoryCompartments(character), { id: `container.${crypto.randomUUID()}`, name, capacity, accepts: accepts.length ? accepts : undefined, source: "custom" }] } };
  state.character = updatedCharacter;
  state.addContainerOpen = false;
  await saveCharacter(updatedCharacter);
  render();
}

export async function deleteInventoryContainer(compartmentId: string | undefined, dependencies: InventoryActionDependencies): Promise<void> {
  const { state, getInventoryCompartments, getEntryCompartmentId, saveCharacter, render } = dependencies;
  const character = state.character;
  if (!character || !compartmentId) return;
  const compartments = getInventoryCompartments(character);
  const compartment = compartments.find((entry) => entry.id === compartmentId);
  if (!compartment || compartment.source === "character") return;
  const selectedEntryWasInDeletedCompartment = character.inventory.entries.some((entry) => entry.definitionId === state.selectedItemId && getEntryCompartmentId(entry) === compartmentId);
  const updatedCharacter: Character = { ...character, inventory: { ...character.inventory, compartments: compartments.filter((entry) => entry.id !== compartmentId), entries: character.inventory.entries.filter((entry) => getEntryCompartmentId(entry) !== compartmentId) } };
  state.character = updatedCharacter;
  state.deleteContainerId = undefined;
  if (selectedEntryWasInDeletedCompartment) state.selectedItemId = undefined;
  await saveCharacter(updatedCharacter);
  render();
}

export async function deleteInventoryItem(itemId: string | undefined, dependencies: InventoryActionDependencies): Promise<void> {
  const { state, saveCharacter, render } = dependencies;
  const character = state.character;
  if (!character || !itemId) return;
  const updatedCharacter: Character = { ...character, inventory: { ...character.inventory, entries: character.inventory.entries.filter((entry) => entry.definitionId !== itemId) } };
  state.character = updatedCharacter;
  state.selectedItemId = undefined;
  state.deletingItemId = undefined;
  await saveCharacter(updatedCharacter);
  render();
}
