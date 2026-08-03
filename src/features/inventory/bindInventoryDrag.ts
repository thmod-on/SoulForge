import type { Character, InventoryCompartment, ItemDefinition } from "../../domain/types";

type InventoryItemEntry = { entry: Character["inventory"]["entries"][number]; item: ItemDefinition };

type DragState = {
  itemId?: string;
  sourceCompartmentId?: string;
  pointerId?: number;
  startX: number;
  startY: number;
  dragging: boolean;
  ghost?: HTMLDivElement;
  currentDropTargetId?: string;
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
  moveItemToCompartment: (itemId: string | undefined, targetCompartmentId: string | undefined, sourceCompartmentId: string | undefined) => Promise<void>;
};

export function consumeInventoryDragClickSuppression(): boolean {
  if (!dragState.suppressNextClick) return false;
  dragState.suppressNextClick = false;
  return true;
}

export function bindInventoryDragEvents(dependencies: InventoryDragDependencies): void {
  document.addEventListener("pointerdown", (event) => {
    if (!(event.target instanceof HTMLElement) || event.button !== 0) return;
    const tile = event.target.closest<HTMLElement>("[data-item-id]");
    if (!tile || !tile.dataset.itemCompartmentId) return;
    dragState.itemId = tile.dataset.itemId;
    dragState.sourceCompartmentId = tile.dataset.itemCompartmentId;
    dragState.pointerId = event.pointerId;
    dragState.startX = event.clientX;
    dragState.startY = event.clientY;
    dragState.dragging = false;
    dragState.currentDropTargetId = undefined;
  });

  document.addEventListener("pointermove", (event) => {
    if (!dragState.itemId || dragState.pointerId !== event.pointerId) return;
    if (!dragState.dragging && Math.hypot(event.clientX - dragState.startX, event.clientY - dragState.startY) < 8) return;
    event.preventDefault();
    if (!dragState.dragging) {
      const tile = document.querySelector<HTMLElement>(`[data-item-id="${CSS.escape(dragState.itemId)}"]`);
      if (tile) createDragGhost(tile, event.clientX, event.clientY);
      dragState.dragging = true;
      dragState.suppressNextClick = true;
    }
    updateDragGhost(event.clientX, event.clientY);
    updateDropTarget(event.clientX, event.clientY, dependencies);
  });

  document.addEventListener("pointerup", (event) => {
    if (!dragState.itemId || dragState.pointerId !== event.pointerId) return;
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
}

function endItemDrag(): void {
  dragState.ghost?.remove();
  dragState.ghost = undefined;
  dragState.itemId = undefined;
  dragState.sourceCompartmentId = undefined;
  dragState.pointerId = undefined;
  dragState.currentDropTargetId = undefined;
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
  const target = document.elementsFromPoint(clientX, clientY).find((element): element is HTMLElement => element instanceof HTMLElement && Boolean(element.closest("[data-compartment-id]")))?.closest<HTMLElement>("[data-compartment-id]");
  const targetId = target?.dataset.compartmentId;
  dragState.currentDropTargetId = targetId;
  if (!target || !targetId) return;
  target.classList.add(isValidDropTarget(targetId, dependencies) ? "is-drop-target" : "is-drop-invalid");
}

function isValidDropTarget(targetCompartmentId: string | undefined, dependencies: InventoryDragDependencies): boolean {
  const character = dependencies.getCharacter();
  if (!character || !dragState.itemId || !targetCompartmentId || targetCompartmentId === dragState.sourceCompartmentId) return false;
  const entries = dependencies.getItemEntries(character);
  const draggedEntry = entries.find(({ item, entry }) => item.id === dragState.itemId && dependencies.getEntryCompartmentId(entry) === dragState.sourceCompartmentId);
  const targetCompartment = dependencies.getInventoryCompartments(character).find((compartment) => compartment.id === targetCompartmentId);
  return Boolean(draggedEntry && targetCompartment && dependencies.canCompartmentAcceptItem(targetCompartment, draggedEntry.item) && dependencies.wouldFitCompartment(targetCompartment, entries, draggedEntry.item, draggedEntry.entry.quantity, dependencies.getEntryCompartmentId(draggedEntry.entry)));
}

async function finishItemDrag(dependencies: InventoryDragDependencies): Promise<void> {
  const targetCompartmentId = dragState.currentDropTargetId;
  const itemId = dragState.itemId;
  const sourceCompartmentId = dragState.sourceCompartmentId;
  const validDrop = isValidDropTarget(targetCompartmentId, dependencies);
  endItemDrag();
  if (validDrop) await dependencies.moveItemToCompartment(itemId, targetCompartmentId, sourceCompartmentId);
}
