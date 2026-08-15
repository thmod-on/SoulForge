import type { ProgressionFlowStep } from "../../app/types";

type FlowStep = { id: ProgressionFlowStep; label: string; shortLabel: string };

const baseSteps: FlowStep[] = [
  { id: "advances", label: "Avanços", shortLabel: "Avanços" },
  { id: "domain-card", label: "Carta de Domínio", shortLabel: "Carta" },
  { id: "review", label: "Revisão", shortLabel: "Revisão" }
];

export function getProgressionFlowSteps(requiresTierExperience: boolean): FlowStep[] {
  return requiresTierExperience
    ? [...baseSteps.slice(0, 2), { id: "tier-experience", label: "Conquista de Tier", shortLabel: "Conquista" }, baseSteps[2]]
    : baseSteps;
}

export function getNextProgressionFlowStep(current: ProgressionFlowStep, requiresTierExperience: boolean): ProgressionFlowStep | undefined {
  const steps = getProgressionFlowSteps(requiresTierExperience);
  const index = steps.findIndex((step) => step.id === current);
  return steps[index + 1]?.id;
}

export function getPreviousProgressionFlowStep(current: ProgressionFlowStep, requiresTierExperience: boolean): ProgressionFlowStep | undefined {
  const steps = getProgressionFlowSteps(requiresTierExperience);
  const index = steps.findIndex((step) => step.id === current);
  return steps[index - 1]?.id;
}

export type ProgressionFlowAdvanceInput = {
  step: ProgressionFlowStep;
  choiceCount: number;
  cardId?: string;
  requiresTierExperience: boolean;
  tierExperienceName?: string;
};

export type ProgressionFlowTransition = { step: ProgressionFlowStep; error?: string };

export function advanceProgressionFlow(input: ProgressionFlowAdvanceInput): ProgressionFlowTransition {
  const blocker = getProgressionStepBlocker(input);
  if (blocker) return { step: input.step, error: blocker };
  return { step: getNextProgressionFlowStep(input.step, input.requiresTierExperience) ?? input.step };
}

export function goBackInProgressionFlow(step: ProgressionFlowStep, requiresTierExperience: boolean): ProgressionFlowTransition {
  return { step: getPreviousProgressionFlowStep(step, requiresTierExperience) ?? step };
}

export function getProgressionStepBlocker(input: ProgressionFlowAdvanceInput): string | undefined {
  if (input.step === "advances" && input.choiceCount !== 2) return `Escolha ${2 - input.choiceCount} avanço${2 - input.choiceCount === 1 ? "" : "s"} antes de continuar.`;
  if (input.step === "domain-card" && !input.cardId) return "Escolha a carta de Domínio antes de continuar.";
  if (input.step === "tier-experience" && input.requiresTierExperience && !input.tierExperienceName?.trim()) return "Defina a nova Experiência +2 recebida ao entrar no Tier.";
  return undefined;
}
