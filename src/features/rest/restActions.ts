import type { Catalog } from "../../domain/catalog";
import type { Character } from "../../domain/types";
import { resetGameMarkers } from "../game-markers/gameMarkerSync";
import { endFeatureEffectsForCondition } from "../feature-effects/featureEffects";
import { applyRestMoves, requiresRestRoll, type RestKind, type RestMoveChoice, type RestMoveId } from "./restRules";

export type RestActionState = { character?: Character; restDialogKind?: RestKind; restChoices: RestMoveChoice[]; restError?: string };
export type RestActionDependencies = { catalog: Catalog; saveCharacter: (character: Character) => Promise<void>; render: () => void };

export function handleRestAction(target: HTMLElement, state: RestActionState, dependencies: RestActionDependencies): boolean {
  if (target.closest('[data-action="open-rest"]')) { openRestDialog("short", state, dependencies); return true; }
  if (target.closest('[data-action="rest-short"]')) { openRestDialog("short", state, dependencies); return true; }
  if (target.closest('[data-action="rest-long"]')) { openRestDialog("long", state, dependencies); return true; }
  const kind = target.closest<HTMLElement>('[data-action="set-rest-kind"]');
  if (kind) { openRestDialog(kind.dataset.restKind as RestKind, state, dependencies); return true; }
  const move = target.closest<HTMLElement>('[data-action="choose-rest-move"]');
  if (move) { if (state.restChoices.length < 2) { state.restChoices = [...state.restChoices, { id: move.dataset.restMove as RestMoveId }]; state.restError = undefined; dependencies.render(); } return true; }
  const remove = target.closest<HTMLElement>('[data-action="remove-rest-move"]');
  if (remove) { state.restChoices = state.restChoices.filter((_, index) => index !== Number(remove.dataset.restChoiceIndex)); state.restError = undefined; dependencies.render(); return true; }
  const roll = target.closest<HTMLElement>('[data-action="roll-rest-d4"]');
  if (roll) { setRestRoll(Number(roll.dataset.restChoiceIndex), crypto.getRandomValues(new Uint32Array(1))[0] % 4 + 1, state, dependencies); return true; }
  if (target.closest('[data-action="confirm-rest"]')) { void confirmRest(state, dependencies); return true; }
  return false;
}

export function handleRestRollInput(target: HTMLInputElement, state: RestActionState): boolean {
  if (!target.matches("[data-rest-roll-index]")) return false;
  const roll = Number(target.value);
  if (!Number.isInteger(roll) || roll < 1 || roll > 4) return true;
  state.restChoices = state.restChoices.map((choice, index) => index === Number(target.dataset.restRollIndex) ? { ...choice, roll } : choice);
  state.restError = undefined;
  return true;
}

function openRestDialog(kind: RestKind, state: RestActionState, dependencies: RestActionDependencies): void { state.restDialogKind = kind; state.restChoices = []; state.restError = undefined; dependencies.render(); }
function setRestRoll(index: number, roll: number, state: RestActionState, dependencies: RestActionDependencies): void { if (!Number.isInteger(roll) || roll < 1 || roll > 4) return; state.restChoices = state.restChoices.map((choice, choiceIndex) => choiceIndex === index ? { ...choice, roll } : choice); state.restError = undefined; dependencies.render(); }
async function confirmRest(state: RestActionState, dependencies: RestActionDependencies): Promise<void> {
  const character = state.character, kind = state.restDialogKind;
  if (!character || !kind || state.restChoices.length !== 2) return;
  if (state.restChoices.some((choice) => requiresRestRoll(kind, choice.id) && !choice.roll)) { state.restError = "Role ou informe o resultado de cada d4 antes de concluir."; dependencies.render(); return; }
  let updated = applyRestMoves(character, kind, state.restChoices);
  updated = endFeatureEffectsForCondition(updated, dependencies.catalog, "short-rest");
  updated = resetGameMarkers(updated, dependencies.catalog, "short-rest");
  if (kind === "long") {
    updated = endFeatureEffectsForCondition(updated, dependencies.catalog, "long-rest");
    updated = resetGameMarkers(updated, dependencies.catalog, "long-rest");
  }
  state.character = updated; state.restDialogKind = undefined; state.restChoices = []; state.restError = undefined;
  await dependencies.saveCharacter(updated); dependencies.render();
}
