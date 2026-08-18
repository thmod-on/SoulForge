import type { CardDefinition } from "../../domain/types";
import type { ProgressionDraftChoice, ProgressionTierNumber } from "../../app/types";
import type { ProgressionDialogState } from "./renderProgressionDialogs";

type Dependencies = {
  state: ProgressionDialogState;
  addChoice: (choice: ProgressionDraftChoice) => void;
  findCard: (id: string) => CardDefinition | undefined;
};

export function handleProgressionCardPickerAction(target: HTMLElement, dependencies: Dependencies): boolean {
  const selection = target.closest<HTMLElement>('[data-action="select-progression-card"]');
  if (selection) {
    dependencies.state.progressionCardPickerSelectionId = selection.dataset.progressionCardId;
    return true;
  }
  if (!target.closest('[data-action="confirm-progression-card-picker"]')) return false;
  const { state } = dependencies;
  const cardId = state.progressionCardPickerSelectionId;
  if (!cardId || !state.progressionCardPickerMode) return true;
  if (state.progressionCardPickerMode === "advance") {
    dependencies.addChoice({ kind: "domain", tier: state.progressionCardPickerTier ?? 2 as ProgressionTierNumber, cardId, label: `Carta adicional: ${dependencies.findCard(cardId)?.name ?? "Carta"}` });
  } else {
    state.progressionCardId = cardId;
    state.progressionError = undefined;
  }
  state.progressionCardPickerMode = undefined;
  state.progressionCardPickerTier = undefined;
  state.progressionCardPickerSelectionId = undefined;
  state.progressionCardTierFilter = "todos";
  return true;
}
