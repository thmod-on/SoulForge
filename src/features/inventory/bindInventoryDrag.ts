import type { Character, InventoryCompartment, ItemDefinition } from "../../domain/types";

type InventoryItemEntry = { entry: Character["inventory"]["entries"][number]; item: ItemDefinition };

type DragState = {
  entryId?: string;
  pointerId?: number;
  startX: number;
  startY: number;
  dragging: boolean;
  ghost?: HTMLDivElement;
  currentDropTargetId?: string;
  currentStackTargetId?: string;
  suppressNextClick: boolean;
};

const dragState: DragState = { startX: 0, startY: 0, dragging: false, suppressNextClick: false };

export type InventoryDragDependencies = {
  getCharacter: () => Character | undefined;
  getItemEntries: (character: Character) => InventoryItemEntry[];
  getInventoryCompartments: (character: Character) => InventoryCompartment[];
  getEntryCompartmentId: (entry: InventoryItemEntry["entry"]) => string;
  canCompartmentAcceptItem: (compartment: InventoryCompartment, item: ItemDefinition) => boolean;
  wouldFitCompartment: (compartment: InventoryCompartment, entries: InventoryItemEntry[], item: ItemDefinition, quantity: number, currentCompartmentId: string) => boolean;
  moveItemToCompartment: (entryId: string | undefined, targetCompartmentId: string | undefined) => Promise<void>;
  mergeInventoryStacks: (sourceEntryId: string | undefined, targetEntryId: string | undefined) => Promise<void>;
};

export function consumeInventoryDragClickSuppression(): boolean {
  if (!dragState.suppressNextClick) return false;
  dragState.suppressNextClick = false;
  return true;
}

export function bindInventoryDragEvents(dependencies: InventoryDragDependencies): void {
  document.addEventListener("pointerdown", (event) => {
    if (!(event.target instanceof HTMLElement) || event.button !== 0) return;
    const tile = event.target.closest<HTMLElement>("[data-inventory-entry-id]");
    if (!tile || !tile.dataset.itemCompartmentId || !tile.dataset.inventoryEntryId) return;
    dragState.entryId = tile.dataset.inventoryEntryId;
    dragState.pointerId = event.pointerId;
    dragState.startX = event.clientX;
    dragState.startY = event.clientY;
    dragState.dragging = false;
    dragState.currentDropTargetId = undefined;
  });

  document.addEventListener("pointermove", (event) => {
    if (!dragState.entryId || dragState.pointerId !== event.pointerId) return;
    if (!dragState.dragging && Math.hypot(event.clientX - dragState.startX, event.clientY - dragState.startY) < 8) return;
    event.preventDefault();
    if (!dragState.dragging) {
      const tile = document.querySelector<HTMLElement>(`[data-inventory-entry-id="${CSS.escape(dragState.entryId)}"]`);
      if (tile) createDragGhost(tile, event.clientX, event.clientY);
      dragState.dragging = true;
      dragState.suppressNextClick = true;
    }
    updateDragGhost(event.clientX, event.clientY);
    updateDropTarget(event.clientX, event.clientY, dependencies);
  });

  document.addEventListener("pointerup", (event) => {
    if (!dragState.entryId || dragState.pointerId !== event.pointerId) return;
    if (!dragState.dragging) {
      endItemDrag();
      return;
    }
    event.preventDefault();
    void finishItemDrag(dependencies);
  });

  document.addEventListener("pointercancel", (event) => {
    if (dragState.pointerId === event.pointerId) endItemDrag();
  });
}

function clearDropTargetStyles(): void {
  document.querySelectorAll(".inventory-compartment").forEach((element) => element.classList.remove("is-drop-target", "is-drop-invalid"));
  document.querySelectorAll("[data-inventory-entry-id]").forEach((element) => element.classList.remove("is-stack-target"));
}

function endItemDrag(): void {
  dragState.ghost?.remove();
  dragState.ghost = undefined;
  dragState.entryId = undefined;
  dragState.pointerId = undefined;
  dragState.currentDropTargetId = undefined;
  dragState.currentStackTargetId = undefined;
  dragState.dragging = false;
  clearDropTargetStyles();
}

function updateDragGhost(clientX: number, clientY: number): void {
  if (dragState.ghost) dragState.ghost.style.transform = `translate(${clientX + 12}px, ${clientY + 12}px)`;
}

function createDragGhost(tile: HTMLElement, clientX: number, clientY: number): void {
  const ghost = document.createElement("div");
  ghost.className = "drag-ghost";
  ghost.textContent = tile.querySelector("strong")?.textContent ?? "Item";
  document.body.append(ghost);
  dragState.ghost = ghost;
  updateDragGhost(clientX, clientY);
}

function updateDropTarget(clientX: number, clientY: number, dependencies: InventoryDragDependencies): void {
  clearDropTargetStyles();
  const stackTarget = getStackTarget(clientX, clientY, dependencies);
  dragState.currentStackTargetId = stackTarget?.dataset.inventoryEntryId;
  if (stackTarget) {
    stackTarget.classList.add("is-stack-target");
    dragState.currentDropTargetId = undefined;
    return;
  }
  const target = document.elementsFromPoint(clientX, clientY).find((element): element is HTMLElement => element instanceof HTMLElement && Boolean(element.closest("[data-compartment-id]")))?.closest<HTMLElement>("[data-compartment-id]");
  const targetId = target?.dataset.compartmentId;
  dragState.currentDropTargetId = targetId;
  if (!target || !targetId) return;
  target.classList.add(isValidDropTarget(targetId, dependencies) ? "is-drop-target" : "is-drop-invalid");
}

function getStackTarget(clientX: number, clientY: number, dependencies: InventoryDragDependencies): HTMLElement | undefined {
  const character = dependencies.getCharacter();
  if (!character || !dragState.entryId) return undefined;
  const target = document.elementsFromPoint(clientX, clientY).find((element): element is HTMLElement => element instanceof HTMLElement && Boolean(element.closest("[data-inventory-entry-id]")))?.closest<HTMLElement>("[data-inventory-entry-id]");
  const targetEntryId = target?.dataset.inventoryEntryId;
  if (!target || !targetEntryId || targetEntryId === dragState.entryId) return undefined;
  const entries = dependencies.getItemEntries(character);
  const source = entries.find(({ entry }) => (entry.id ?? entry.definitionId) === dragState.entryId);
  const destination = entries.find(({ entry }) => (entry.id ?? entry.definitionId) === targetEntryId);
  return source && destination && source.entry.definitionId === destination.entry.definitionId && dependencies.getEntryCompartmentId(source.entry) === dependencies.getEntryCompartmentId(destination.entry) && Boolean(source.entry.equipped) === Boolean(destination.entry.equipped) ? target : undefined;
}

function isValidDropTarget(targetCompartmentId: string | undefined, dependencies: InventoryDragDependencies): boolean {
  const character = dependencies.getCharacter();
  if (!character || !dragState.entryId || !targetCompartmentId) return false;
  const entries = dependencies.getItemEntries(character);
  const draggedEntry = entries.find(({ entry }) => (entry.id ?? entry.definitionId) === dragState.entryId);
  if (draggedEntry && targetCompartmentId === dependencies.getEntryCompartmentId(draggedEntry.entry)) return false;
  const targetCompartment = dependencies.getInventoryCompartments(character).find((compartment) => compartment.id === targetCompartmentId);
  return Boolean(draggedEntry && targetCompartment && dependencies.canCompartmentAcceptItem(targetCompartment, draggedEntry.item) && dependencies.wouldFitCompartment(targetCompartment, entries, draggedEntry.item, draggedEntry.entry.quantity, dependencies.getEntryCompartmentId(draggedEntry.entry)));
}

async function finishItemDrag(dependencies: InventoryDragDependencies): Promise<void> {
  const targetCompartmentId = dragState.currentDropTargetId;
  const stackTargetId = dragState.currentStackTargetId;
  const entryId = dragState.entryId;
  const validDrop = isValidDropTarget(targetCompartmentId, dependencies);
  endItemDrag();
  if (stackTargetId) await dependencies.mergeInventoryStacks(entryId, stackTargetId);
  else if (validDrop) await dependencies.moveItemToCompartment(entryId, targetCompartmentId);
}
