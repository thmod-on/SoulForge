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
  deletingItemQuantity?: number;
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

function getEntryId(entry: Character["inventory"]["entries"][number]): string {
  return entry.id ?? entry.definitionId;
}

function getManagedQuantity(entry: Character["inventory"]["entries"][number]): number {
  const value = Number(document.querySelector<HTMLInputElement>("[data-item-managed-quantity]")?.value ?? entry.quantity);
  return Number.isInteger(value) ? Math.max(1, Math.min(entry.quantity, value)) : entry.quantity;
}

function withEntryIds(entries: Character["inventory"]["entries"]): Character["inventory"]["entries"] {
  return entries.map((entry) => entry.id ? entry : { ...entry, id: crypto.randomUUID() });
}

export async function moveItemToCompartment(entryId: string | undefined, targetCompartmentId: string | undefined, dependencies: InventoryActionDependencies): Promise<void> {
  const { state, getItemEntries, getInventoryCompartments, getEntryCompartmentId, canCompartmentAcceptItem, wouldFitCompartment, saveCharacter, render } = dependencies;
  const character = state.character;
  const selectedTargetId = targetCompartmentId ?? document.querySelector<HTMLSelectElement>("[data-item-move-destination]")?.value;
  if (!character || !entryId || !selectedTargetId) return;
  const entries = getItemEntries(character);
  const targetEntry = entries.find(({ entry }) => getEntryId(entry) === entryId);
  const targetCompartment = getInventoryCompartments(character).find((compartment) => compartment.id === selectedTargetId);
  if (!targetEntry || !targetCompartment) return;
  const currentCompartmentId = getEntryCompartmentId(targetEntry.entry);
  const quantity = getManagedQuantity(targetEntry.entry);
  if (!canCompartmentAcceptItem(targetCompartment, targetEntry.item) || !wouldFitCompartment(targetCompartment, entries, targetEntry.item, quantity, currentCompartmentId)) return;
  const normalizedEntries = withEntryIds(character.inventory.entries);
  const sourceIndex = character.inventory.entries.findIndex((entry) => getEntryId(entry) === entryId);
  const sourceEntry = normalizedEntries[sourceIndex];
  if (!sourceEntry) return;
  const updatedEntries = quantity === sourceEntry.quantity
    ? normalizedEntries.map((entry, index) => index === sourceIndex ? { ...entry, compartmentId: selectedTargetId, equipped: selectedTargetId === "equipped" } : entry)
    : normalizedEntries.flatMap((entry, index) => index !== sourceIndex ? [entry] : [{ ...entry, quantity: entry.quantity - quantity }, { ...entry, id: crypto.randomUUID(), quantity, compartmentId: selectedTargetId, equipped: selectedTargetId === "equipped" }]);
  const updatedCharacter: Character = { ...character, inventory: { ...character.inventory, entries: updatedEntries } };
  state.character = updatedCharacter;
  state.selectedItemId = quantity === sourceEntry.quantity ? undefined : getEntryId(sourceEntry);
  await saveCharacter(updatedCharacter);
  render({ preserveMainScroll: true });
}

export async function splitInventoryItem(entryId: string | undefined, dependencies: InventoryActionDependencies): Promise<void> {
  const { state, getItemEntries, getEntryCompartmentId, saveCharacter, render } = dependencies;
  const character = state.character;
  if (!character || !entryId) return;
  const selected = getItemEntries(character).find(({ entry }) => getEntryId(entry) === entryId);
  if (!selected || selected.entry.quantity < 2) return;
  const quantity = getManagedQuantity(selected.entry);
  if (quantity >= selected.entry.quantity) return;
  const normalizedEntries = withEntryIds(character.inventory.entries);
  const sourceIndex = character.inventory.entries.findIndex((entry) => getEntryId(entry) === entryId);
  const sourceEntry = normalizedEntries[sourceIndex];
  if (!sourceEntry) return;
  const updatedCharacter: Character = { ...character, inventory: { ...character.inventory, entries: normalizedEntries.flatMap((entry, index) => index !== sourceIndex ? [entry] : [{ ...entry, quantity: entry.quantity - quantity }, { ...entry, id: crypto.randomUUID(), quantity, compartmentId: getEntryCompartmentId(entry), equipped: entry.equipped }]) } };
  state.character = updatedCharacter;
  state.selectedItemId = getEntryId(sourceEntry);
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
  const updatedEntries = existingEntry ? character.inventory.entries.map((entry) => entry === existingEntry ? { ...entry, quantity: entry.quantity + quantity } : entry) : [...character.inventory.entries, { id: crypto.randomUUID(), definitionId: definition.id, quantity, compartmentId, equipped: compartmentId === "equipped" }];
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
  const selectedEntryWasInDeletedCompartment = character.inventory.entries.some((entry) => getEntryId(entry) === state.selectedItemId && getEntryCompartmentId(entry) === compartmentId);
  const updatedCharacter: Character = { ...character, inventory: { ...character.inventory, compartments: compartments.filter((entry) => entry.id !== compartmentId), entries: character.inventory.entries.filter((entry) => getEntryCompartmentId(entry) !== compartmentId) } };
  state.character = updatedCharacter;
  state.deleteContainerId = undefined;
  if (selectedEntryWasInDeletedCompartment) state.selectedItemId = undefined;
  await saveCharacter(updatedCharacter);
  render();
}

export function prepareDeleteInventoryItem(entryId: string | undefined, dependencies: InventoryActionDependencies): void {
  const { state, getItemEntries } = dependencies;
  const character = state.character;
  if (!character || !entryId) return;
  const selected = getItemEntries(character).find(({ entry }) => getEntryId(entry) === entryId);
  if (!selected) return;
  state.deletingItemId = entryId;
  state.deletingItemQuantity = getManagedQuantity(selected.entry);
  state.selectedItemId = undefined;
}

export async function deleteInventoryItem(entryId: string | undefined, dependencies: InventoryActionDependencies): Promise<void> {
  const { state, saveCharacter, render } = dependencies;
  const character = state.character;
  if (!character || !entryId) return;
  const normalizedEntries = withEntryIds(character.inventory.entries);
  const entryIndex = character.inventory.entries.findIndex((candidate) => getEntryId(candidate) === entryId);
  const entry = normalizedEntries[entryIndex];
  if (!entry) return;
  const quantity = Math.max(1, Math.min(entry.quantity, state.deletingItemQuantity ?? entry.quantity));
  const updatedEntries = quantity === entry.quantity
    ? normalizedEntries.filter((_, index) => index !== entryIndex)
    : normalizedEntries.map((candidate, index) => index === entryIndex ? { ...candidate, quantity: candidate.quantity - quantity } : candidate);
  const updatedCharacter: Character = { ...character, inventory: { ...character.inventory, entries: updatedEntries } };
  state.character = updatedCharacter;
  state.selectedItemId = undefined;
  state.deletingItemId = undefined;
  state.deletingItemQuantity = undefined;
  await saveCharacter(updatedCharacter);
  render();
}
