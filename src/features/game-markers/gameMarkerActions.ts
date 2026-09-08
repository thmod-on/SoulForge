import type { Catalog } from "../../domain/catalog";
import type { Character } from "../../domain/types";
import type { GameMarkerDiceDialogState } from "./renderDiceDialog";
import { getActiveGameMarkers, resetGameMarkers } from "./gameMarkerSync";

export type GameMarkerActionDependencies = {
  state: { character?: Character; gameMarkerDieDialog?: GameMarkerDiceDialogState };
  catalog: Catalog;
  saveCharacter(character: Character): Promise<void>;
  render(): void;
};

/** Centraliza as interacoes dos marcadores e deixa o orquestrador sem regras dessa feature. */
export function handleGameMarkerAction(target: HTMLElement, deps: GameMarkerActionDependencies): boolean {
  const adjustButton = target.closest<HTMLElement>("[data-game-marker-adjust]");
  if (adjustButton) {
    const markerKey = adjustButton.dataset.gameMarkerAdjust;
    const delta = Number(adjustButton.dataset.gameMarkerDelta);
    if (markerKey && Number.isFinite(delta) && delta !== 0) void persistMarkerChange(deps, (character) => adjustGameMarkerCounter(character, markerKey, delta));
    return true;
  }

  const dieSlot = target.closest<HTMLElement>('[data-action="interact-game-marker-die"]');
  if (dieSlot) {
    const character = deps.state.character;
    const markerKey = dieSlot.dataset.gameMarkerKey;
    const dieId = dieSlot.dataset.gameMarkerDieId;
    const marker = character && markerKey ? getActiveGameMarkers(character, deps.catalog).find((entry) => entry.key === markerKey && entry.state.kind === "dice") : undefined;
    const die = marker?.state.kind === "dice" ? marker.state.results.find((entry) => entry.id === dieId) : undefined;
    if (markerKey && dieId && die && !die.used) {
      deps.state.gameMarkerDieDialog = { markerKey, dieId, mode: die.value ? "consume" : "result" };
      deps.render();
    }
    return true;
  }

  const resultButton = target.closest<HTMLElement>('[data-action="set-game-marker-die-result"]');
  if (resultButton) {
    const dialog = deps.state.gameMarkerDieDialog;
    const value = Number(resultButton.dataset.gameMarkerDieValue);
    if (dialog && Number.isInteger(value)) void persistMarkerChange(deps, (character) => setGameMarkerDieResult(character, dialog.markerKey, dialog.dieId, value), true);
    return true;
  }

  if (target.closest('[data-action="confirm-game-marker-die-use"]')) {
    const dialog = deps.state.gameMarkerDieDialog;
    if (dialog) void persistMarkerChange(deps, (character) => consumeGameMarkerDie(character, dialog.markerKey, dialog.dieId), true);
    return true;
  }

  if (target.closest('[data-action="reset-game-markers-session"]')) {
    void persistMarkerChange(deps, (character) => resetGameMarkers(character, deps.catalog, "session"));
    return true;
  }

  return false;
}

export function adjustGameMarkerCounter(character: Character, markerKey: string, delta: number): Character {
  const gameMarkers = (character.gameMarkers ?? []).map((marker) => {
    if (marker.key !== markerKey || marker.kind !== "counter") return marker;
    const value = marker.max === undefined ? marker.value + delta : Math.min(marker.max, Math.max(0, marker.value + delta));
    return { ...marker, value: Math.max(0, value) };
  });
  return { ...character, gameMarkers };
}

export function setGameMarkerDieResult(character: Character, markerKey: string, dieId: string, value: number): Character {
  const gameMarkers = (character.gameMarkers ?? []).map((marker) => {
    if (marker.key !== markerKey || marker.kind !== "dice") return marker;
    const sides = Number(marker.die.slice(1));
    if (!Number.isInteger(value) || value < 1 || value > sides) return marker;
    return { ...marker, results: marker.results.map((die) => die.id !== dieId ? die : die.value === value ? { ...die, value: 0, used: false } : { ...die, value, used: false }) };
  });
  return { ...character, gameMarkers };
}

export function consumeGameMarkerDie(character: Character, markerKey: string, dieId: string): Character {
  const gameMarkers = (character.gameMarkers ?? []).map((marker) => {
    if (marker.key !== markerKey || marker.kind !== "dice") return marker;
    return { ...marker, results: marker.results.map((die) => die.id !== dieId || die.value === 0 || die.used ? die : { ...die, used: true }) };
  });
  return { ...character, gameMarkers };
}

async function persistMarkerChange(deps: GameMarkerActionDependencies, update: (character: Character) => Character, closeDialog = false): Promise<void> {
  const character = deps.state.character;
  if (!character) return;
  const updatedCharacter = update(character);
  deps.state.character = updatedCharacter;
  if (closeDialog) deps.state.gameMarkerDieDialog = undefined;
  await deps.saveCharacter(updatedCharacter);
  deps.render();
}
