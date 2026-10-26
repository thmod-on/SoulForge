type DragSource = "loadout" | "vault";
type DragState = { cardId?: string; source?: DragSource; sourceElement?: HTMLElement; pointerId?: number; startX: number; startY: number; dragging: boolean; ghost?: HTMLDivElement; slotIndex?: number; overVault: boolean; suppressNextClick: boolean };

const drag: DragState = { startX: 0, startY: 0, dragging: false, overVault: false, suppressNextClick: false };

export type RestLoadoutDragDependencies = { isActive: () => boolean; getDraft: () => string[] | undefined; setDraft: (draft: string[]) => void };

export function consumeRestLoadoutDragClickSuppression(): boolean {
  if (!drag.suppressNextClick) return false;
  drag.suppressNextClick = false;
  return true;
}

export function bindRestLoadoutDragEvents(dependencies: RestLoadoutDragDependencies): void {
  document.addEventListener("pointerdown", (event) => {
    if (!(event.target instanceof HTMLElement) || event.button !== 0 || !dependencies.isActive()) return;
    const card = event.target.closest<HTMLElement>("[data-rest-loadout-drag-card]");
    if (!card || event.target.closest("button[data-action]:not([data-action=\"view-rest-loadout-card\"])") || event.target.closest("[data-rest-loadout-fallback]")) return;
    const source = card.dataset.restLoadoutSource as DragSource | undefined;
    if (!source || !card.dataset.cardId) return;
    drag.cardId = card.dataset.cardId; drag.source = source; drag.sourceElement = card; drag.pointerId = event.pointerId; drag.startX = event.clientX; drag.startY = event.clientY; drag.dragging = false; drag.slotIndex = undefined; drag.overVault = false;
  });
  document.addEventListener("pointermove", (event) => {
    if (!drag.cardId || drag.pointerId !== event.pointerId) return;
    if (!drag.dragging && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 8) return;
    event.preventDefault();
    if (!drag.dragging) { createGhost(event.clientX, event.clientY); drag.dragging = true; drag.suppressNextClick = true; markAvailableSlots(); }
    updateGhost(event.clientX, event.clientY); updateTarget(event.clientX, event.clientY);
  }, { passive: false });
  document.addEventListener("pointerup", (event) => {
    if (!drag.cardId || drag.pointerId !== event.pointerId) return;
    if (!drag.dragging) { endDrag(); return; }
    event.preventDefault();
    const { cardId, source, slotIndex, overVault } = drag;
    endDrag();
    if (!cardId || !source) return;
    const draft = dependencies.getDraft();
    if (!draft) return;
    if (overVault && source === "loadout") dependencies.setDraft(draft.filter((entry) => entry !== cardId));
    else if (slotIndex !== undefined && !(source === "vault" && draft[slotIndex])) {
      const currentIndex = draft.indexOf(cardId), next = currentIndex < 0 ? [...draft] : draft.filter((entry) => entry !== cardId);
      if (currentIndex >= 0 || next.length < 5) { next.splice(Math.min(slotIndex, next.length), 0, cardId); dependencies.setDraft(next); }
    }
  });
  document.addEventListener("pointercancel", (event) => { if (drag.pointerId === event.pointerId) endDrag(); });
}

function createGhost(x: number, y: number): void {
  const source = drag.sourceElement;
  const ghost = document.createElement("div"); ghost.className = "rest-loadout-drag-ghost";
  const art = source?.querySelector<HTMLElement>(".rest-loadout-mini-art")?.cloneNode(true);
  const label = document.createElement("strong"); label.textContent = source?.querySelector("strong")?.textContent ?? "Carta";
  if (art) ghost.append(art); ghost.append(label); source?.classList.add("is-dragging"); document.body.append(ghost); drag.ghost = ghost; updateGhost(x, y);
}
function updateGhost(x: number, y: number): void { if (drag.ghost) drag.ghost.style.transform = `translate(${x + 12}px, ${y + 12}px)`; }
function updateTarget(x: number, y: number): void {
  clearCurrentTarget();
  const elements = document.elementsFromPoint(x, y);
  const slot = elements.find((entry): entry is HTMLElement => entry instanceof HTMLElement && Boolean(entry.closest("[data-rest-loadout-slot]")))?.closest<HTMLElement>("[data-rest-loadout-slot]");
  const vault = elements.find((entry): entry is HTMLElement => entry instanceof HTMLElement && Boolean(entry.closest("[data-rest-vault-dropzone]")))?.closest<HTMLElement>("[data-rest-vault-dropzone]");
  if (slot && slot.dataset.restLoadoutSlotIndex && (drag.source === "loadout" || slot.dataset.restLoadoutSlotEmpty === "true")) { drag.slotIndex = Number(slot.dataset.restLoadoutSlotIndex); slot.classList.add("is-drop-target"); return; }
  if (vault && drag.source === "loadout") { drag.overVault = true; vault.classList.add("is-drop-target"); }
}
function markAvailableSlots(): void { if (drag.source === "vault") document.querySelectorAll<HTMLElement>('[data-rest-loadout-slot-empty="true"]').forEach((entry) => entry.classList.add("is-drop-available")); }
function clearCurrentTarget(): void { document.querySelectorAll("[data-rest-loadout-slot], [data-rest-vault-dropzone]").forEach((entry) => entry.classList.remove("is-drop-target")); drag.slotIndex = undefined; drag.overVault = false; }
function clearDropStyles(): void { clearCurrentTarget(); document.querySelectorAll('[data-rest-loadout-slot-empty="true"]').forEach((entry) => entry.classList.remove("is-drop-available")); }
function endDrag(): void { drag.ghost?.remove(); drag.sourceElement?.classList.remove("is-dragging"); drag.cardId = undefined; drag.source = undefined; drag.sourceElement = undefined; drag.pointerId = undefined; drag.ghost = undefined; drag.dragging = false; clearDropStyles(); }
