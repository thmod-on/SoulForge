import type { Catalog } from "../../domain/catalog";
import type { Character, GameMarkerDie, StoredDiceGameMarkerState } from "../../domain/types";
import { getActiveGameMarkers, type ActiveGameMarker } from "./gameMarkerSync";

export type StoredDiceDialogState = { markerKey: string; amount: number; results?: number[] };

export type StoredDiceDependencies = {
  state: { character?: Character; storedDiceDialog?: StoredDiceDialogState };
  catalog: Catalog;
  saveCharacter(character: Character): Promise<void>;
  render(): void;
  escapeHtml(value: string): string;
};

export function renderStoredDiceDialog(deps: Pick<StoredDiceDependencies, "state" | "catalog" | "escapeHtml">): string {
  const dialog = deps.state.storedDiceDialog;
  const character = deps.state.character;
  if (!dialog || !character) return "";
  const marker = findStoredDiceMarker(character, deps.catalog, dialog.markerKey);
  if (!marker) return "";
  const amount = Math.min(Math.max(1, dialog.amount), marker.state.available);
  const results = dialog.results;
  const total = results?.reduce((sum, value) => sum + value, 0) ?? 0;
  return `<div class="modal-backdrop" data-modal-backdrop><section class="confirm-modal game-marker-die-dialog" role="dialog" aria-modal="true" aria-labelledby="stored-dice-title"><button class="modal-close" type="button" data-modal-close aria-label="Cancelar gasto">x</button><span class="resource-modal-label">${marker.state.die}</span><h2 id="stored-dice-title">Gastar ${deps.escapeHtml(marker.definition.label)}</h2>${results ? `<p>Resultado: <strong>${total}</strong></p><div class="stored-dice-roll-results" aria-label="Resultados">${results.map((value) => `<span>${value}</span>`).join("")}</div><p>Some <strong>${total}</strong> à rolagem de ataque ou dano e confirme para gastar ${amount} dado${amount === 1 ? "" : "s"}.</p><div class="modal-actions"><button class="sf-action sf-action--secondary secondary-action" type="button" data-action="retry-stored-game-marker-dice">Voltar</button><button class="sf-action sf-action--primary primary-action" type="button" data-action="confirm-stored-game-marker-dice-spend">Confirmar gasto</button></div>` : `<p>Escolha quantos dados armazenados deseja rolar para esta rolagem de ataque ou dano.</p><div class="stored-dice-amount-picker">${Array.from({ length: marker.state.available }, (_, index) => index + 1).map((value) => `<button type="button" class="sf-action sf-action--secondary sf-action--compact ${value === amount ? "is-selected" : ""}" data-action="select-stored-game-marker-dice-amount" data-stored-dice-amount="${value}">${value}</button>`).join("")}</div><div class="modal-actions"><button class="sf-action sf-action--secondary secondary-action" type="button" data-modal-close>Cancelar</button><button class="sf-action sf-action--primary primary-action" type="button" data-action="roll-stored-game-marker-dice">Rolar ${amount}d${marker.state.die.slice(1)}</button></div>`}</section></div>`;
}

/** Trata o fluxo de guardar, rolar e confirmar gasto de uma reserva de dados. */
export function handleStoredDiceAction(target: HTMLElement, deps: StoredDiceDependencies): boolean {
  const storeButton = target.closest<HTMLElement>('[data-action="store-game-marker-die"]');
  if (storeButton) {
    const markerKey = storeButton.dataset.gameMarkerKey;
    if (markerKey) void storeDie(markerKey, deps);
    return true;
  }

  const spendButton = target.closest<HTMLElement>('[data-action="spend-stored-game-marker-dice"]');
  if (spendButton) {
    const markerKey = spendButton.dataset.gameMarkerKey;
    if (markerKey) {
      deps.state.storedDiceDialog = { markerKey, amount: 1 };
      deps.render();
    }
    return true;
  }

  const amountButton = target.closest<HTMLElement>('[data-action="select-stored-game-marker-dice-amount"]');
  if (amountButton && deps.state.storedDiceDialog) {
    const amount = Number(amountButton.dataset.storedDiceAmount);
    if (Number.isInteger(amount) && amount > 0) {
      deps.state.storedDiceDialog = { ...deps.state.storedDiceDialog, amount, results: undefined };
      deps.render();
    }
    return true;
  }

  if (target.closest('[data-action="roll-stored-game-marker-dice"]') && deps.state.storedDiceDialog && deps.state.character) {
    const marker = findStoredDiceMarker(deps.state.character, deps.catalog, deps.state.storedDiceDialog.markerKey);
    if (marker) {
      const amount = Math.min(deps.state.storedDiceDialog.amount, marker.state.available);
      deps.state.storedDiceDialog = { ...deps.state.storedDiceDialog, amount, results: rollDice(marker.state.die, amount) };
      deps.render();
    }
    return true;
  }

  if (target.closest('[data-action="retry-stored-game-marker-dice"]') && deps.state.storedDiceDialog) {
    deps.state.storedDiceDialog = { ...deps.state.storedDiceDialog, results: undefined };
    deps.render();
    return true;
  }

  if (target.closest('[data-action="confirm-stored-game-marker-dice-spend"]') && deps.state.storedDiceDialog) {
    void spendDice(deps.state.storedDiceDialog.markerKey, deps.state.storedDiceDialog.amount, deps);
    return true;
  }
  return false;
}

function findStoredDiceMarker(character: Character, catalog: Catalog, markerKey: string): (ActiveGameMarker & { state: StoredDiceGameMarkerState }) | undefined {
  const marker = getActiveGameMarkers(character, catalog).find((entry) => entry.key === markerKey && entry.state.kind === "stored-dice");
  return marker?.state.kind === "stored-dice" ? marker as ActiveGameMarker & { state: StoredDiceGameMarkerState } : undefined;
}

async function storeDie(markerKey: string, deps: StoredDiceDependencies): Promise<void> {
  const character = deps.state.character;
  if (!character) return;
  const gameMarkers = (character.gameMarkers ?? []).map((marker) => marker.key !== markerKey || marker.kind !== "stored-dice" || marker.available >= marker.max ? marker : { ...marker, available: marker.available + 1 });
  const updatedCharacter = { ...character, gameMarkers };
  deps.state.character = updatedCharacter;
  await deps.saveCharacter(updatedCharacter);
  deps.render();
}

async function spendDice(markerKey: string, amount: number, deps: StoredDiceDependencies): Promise<void> {
  const character = deps.state.character;
  if (!character || amount < 1) return;
  const gameMarkers = (character.gameMarkers ?? []).map((marker) => marker.key !== markerKey || marker.kind !== "stored-dice" ? marker : { ...marker, available: Math.max(0, marker.available - amount) });
  const updatedCharacter = { ...character, gameMarkers };
  deps.state.character = updatedCharacter;
  deps.state.storedDiceDialog = undefined;
  await deps.saveCharacter(updatedCharacter);
  deps.render();
}

function rollDice(die: GameMarkerDie, amount: number): number[] {
  const values = new Uint32Array(amount);
  crypto.getRandomValues(values);
  const sides = Number(die.slice(1));
  return [...values].map((value) => value % sides + 1);
}
