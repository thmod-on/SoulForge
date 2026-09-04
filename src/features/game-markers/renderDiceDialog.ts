import type { Catalog } from "../../domain/catalog";
import type { Character, DiceGameMarkerState, GameMarkerDie } from "../../domain/types";
import { getActiveGameMarkers, type ActiveGameMarker } from "./gameMarkerSync";

export type GameMarkerDiceDialogState = { markerKey: string; dieId: string; mode: "result" | "consume" };

export function renderGameMarkerDiceDialog(state: GameMarkerDiceDialogState | undefined, character: Character | undefined, catalog: Catalog, escapeHtml: (value: string) => string): string {
  if (!state || !character) return "";
  const marker = getActiveGameMarkers(character, catalog).find((entry) => entry.key === state.markerKey && entry.state.kind === "dice") as (ActiveGameMarker & { state: DiceGameMarkerState }) | undefined;
  const diceState = marker?.state;
  if (!marker || !diceState || diceState.kind !== "dice") return "";
  const die = diceState.results.find((entry) => entry.id === state.dieId);
  if (!die) return "";
  if (state.mode === "result") {
    return `<div class="modal-backdrop" data-modal-backdrop><section class="confirm-modal game-marker-die-dialog" role="dialog" aria-modal="true" aria-labelledby="game-marker-result-title"><button class="modal-close" type="button" data-modal-close aria-label="Cancelar">x</button><span class="resource-modal-label">${diceState.die}</span><h2 id="game-marker-result-title">Definir resultado</h2><p>Escolha o resultado deste dado de ${escapeHtml(marker.definition.label)}.</p><div class="game-marker-result-picker">${getGameMarkerDieFaces(diceState.die).map((value) => `<button type="button" class="die-${diceState.die}" data-action="set-game-marker-die-result" data-game-marker-die-value="${value}">${value}</button>`).join("")}</div></section></div>`;
  }
  return `<div class="modal-backdrop" data-modal-backdrop><section class="confirm-modal game-marker-die-dialog" role="dialog" aria-modal="true" aria-labelledby="game-marker-consume-title"><button class="modal-close" type="button" data-modal-close aria-label="Cancelar">x</button><span class="resource-modal-label">${marker.state.die}</span><h2 id="game-marker-consume-title">Consumir dado?</h2><p>Você consumirá um dado de <strong>${escapeHtml(marker.definition.label)}</strong> com resultado <strong>${die.value}</strong>.</p><div class="modal-actions"><button class="sf-action sf-action--secondary secondary-action" type="button" data-modal-close>Cancelar</button><button class="sf-action sf-action--primary primary-action" type="button" data-action="confirm-game-marker-die-use">Consumir dado</button></div></section></div>`;
}

function getGameMarkerDieFaces(die: GameMarkerDie): number[] {
  return Array.from({ length: Number(die.slice(1)) }, (_, index) => index + 1);
}
