import { describe, expect, it } from "vitest";
import { advanceProgressionFlow, getProgressionFlowSteps, goBackInProgressionFlow } from "./progressionFlow";

describe("fluxo guiado de progressão", () => {
  it("inclui a conquista de Tier apenas quando ela é necessária", () => {
    expect(getProgressionFlowSteps(false).map((step) => step.id)).toEqual(["advances", "domain-card", "review"]);
    expect(getProgressionFlowSteps(true).map((step) => step.id)).toEqual(["advances", "domain-card", "tier-experience", "review"]);
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
