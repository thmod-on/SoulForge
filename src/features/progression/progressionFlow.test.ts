import { describe, expect, it } from "vitest";
import { advanceProgressionFlow, getProgressionFlowSteps, goBackInProgressionFlow } from "./progressionFlow";

describe("fluxo guiado de progressão", () => {
  it("inclui a conquista de Tier apenas quando ela é necessária", () => {
    expect(getProgressionFlowSteps(false).map((step) => step.id)).toEqual(["advances", "domain-card", "card-swap", "review"]);
    expect(getProgressionFlowSteps(true).map((step) => step.id)).toEqual(["advances", "domain-card", "card-swap", "tier-experience", "review"]);
  });

  it("permite ignorar a troca e bloqueia apenas uma troca incompleta", () => {
    expect(advanceProgressionFlow({ step: "card-swap", choiceCount: 2, requiresTierExperience: false })).toEqual({ step: "review" });
    expect(advanceProgressionFlow({ step: "card-swap", choiceCount: 2, swapFromCardId: "card.old", requiresTierExperience: false })).toEqual({ step: "card-swap", error: "Conclua a troca de carta ou mantenha as cartas atuais." });
  });

  it("impede avançar enquanto a escolha obrigatória da etapa estiver ausente", () => {
    const transition = advanceProgressionFlow({
      step: "advances",
      choiceCount: 1,
      requiresTierExperience: false
    });

    expect(transition.step).toBe("advances");
    expect(transition.error).toContain("Escolha 1 avanço");
  });

  it("preserva o rascunho e retorna à etapa anterior", () => {
    expect(goBackInProgressionFlow("review", true)).toEqual({ step: "tier-experience" });
  });
});
