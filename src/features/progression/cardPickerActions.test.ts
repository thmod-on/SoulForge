import { describe, expect, it } from "vitest";
import type { ProgressionDialogState } from "./renderProgressionDialogs";
import { handleProgressionCardPickerAction } from "./cardPickerActions";

function state(): ProgressionDialogState {
  return {
    progressionHistoryOpen: false,
    progressionPickerIds: [],
    progressionDraft: [],
    progressionCardPickerMode: "advance",
    progressionCardTierFilter: "todos",
    progressionTierExperienceOpen: false,
    progressionMulticlassOpen: false,
    progressionMulticlassDraft: {}
  };
}

function target(action: string, data: Record<string, string> = {}): HTMLElement {
  return { closest: (selector: string) => selector === `[data-action="${action}"]` ? { dataset: data } : null } as unknown as HTMLElement;
}

describe("ações do seletor de cartas da progressão", () => {
  it("mantém seleção e detalhes como estados independentes", () => {
    const current = state();
    const dependencies = { state: current, addChoice: () => undefined, findCard: () => undefined };

    handleProgressionCardPickerAction(target("toggle-progression-card-details", { progressionCardId: "card.one" }), dependencies);
    expect(current.progressionCardPickerExpandedId).toBe("card.one");
    expect(current.progressionCardPickerSelectionId).toBeUndefined();

    handleProgressionCardPickerAction(target("select-progression-card", { progressionCardId: "card.one" }), dependencies);
    expect(current.progressionCardPickerSelectionId).toBe("card.one");
    expect(current.progressionCardPickerExpandedId).toBe("card.one");
  });

  it("preserva a carta escolhida ao trocar de domínio", () => {
    const current = state();
    current.progressionCardPickerSelectionId = "card.outro-dominio";

    handleProgressionCardPickerAction(target("filter-progression-card-domain", { progressionCardDomain: "domain.other" }), { state: current, addChoice: () => undefined, findCard: () => undefined });

    expect(current.progressionCardDomainFilter).toBe("domain.other");
    expect(current.progressionCardPickerSelectionId).toBe("card.outro-dominio");
  });
});
