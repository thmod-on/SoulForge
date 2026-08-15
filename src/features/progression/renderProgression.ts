import type { ProgressionFlowStep } from "../../app/types";
import type { Character } from "../../domain/types";
import { getTierForLevel } from "./progressionRules";
import { getPreviousProgressionFlowStep, getProgressionFlowSteps } from "./progressionFlow";

export type ProgressionViewState = {
  progressionStep: ProgressionFlowStep;
  progressionError?: string;
};

export type ProgressionRenderDependencies = {
  state: ProgressionViewState;
  escapeHtml: (value: string) => string;
  progressPercent: (value: number, max: number) => number;
  requiresTierExperience: (character: Character) => boolean;
  renderProgressionOptions: (character: Character) => string;
  renderProgressionAdvanceSummary: () => string;
  renderProgressionDomainStep: (character: Character) => string;
  renderTierExperienceStep: (character: Character) => string;
  renderProgressionReview: (character: Character) => string;
};

export function renderProgression(character: Character, dependencies: ProgressionRenderDependencies): string {
  const { state, progressPercent, requiresTierExperience } = dependencies;
  const nextLevel = Math.min(character.identity.level + 1, 10);
  const tier = getTierForLevel(nextLevel);
  const needsExperience = requiresTierExperience(character);
  const steps = getProgressionFlowSteps(needsExperience);
  const currentStep = steps.some((step) => step.id === state.progressionStep) ? state.progressionStep : "advances";
  const currentStepIndex = steps.findIndex((step) => step.id === currentStep);
  const title = steps[currentStepIndex]?.label ?? "Avanços";

  return `<main class="content progression-content"><div class="screen-title"><div><h1>Progressão</h1><p>Nível ${character.identity.level} para ${nextLevel} · Tier ${tier}</p></div><button class="progression-history-button" type="button" data-action="open-progression-history">Ver histórico</button></div><section class="progression-wizard"><div class="progression-character-status" aria-label="Nível e experiência do personagem"><strong>Nível ${character.identity.level}</strong><span>${character.identity.xp} / ${character.identity.nextLevelXp} XP</span><div class="progression-xp-bar" aria-hidden="true"><i style="width: ${progressPercent(character.identity.xp, character.identity.nextLevelXp)}%"></i></div></div><div class="character-creation-progress progression-creation-progress" aria-label="Etapa ${currentStepIndex + 1} de ${steps.length}">${steps.map((step, index) => `<span class="${index === currentStepIndex ? "is-current" : index < currentStepIndex ? "is-complete" : ""}">${index + 1}. ${step.label}</span>`).join("")}</div><section class="progression-wizard-stage" aria-labelledby="progression-wizard-title"><header><h2 id="progression-wizard-title">${title}</h2></header>${renderProgressionStep(currentStep, character, dependencies)}${state.progressionError ? `<p class="progression-feedback" role="alert">${dependencies.escapeHtml(state.progressionError)}</p>` : ""}<footer class="progression-wizard-actions">${getPreviousProgressionFlowStep(currentStep, needsExperience) ? '<button class="secondary-action" type="button" data-action="progression-step-back">← Voltar</button>' : "<span></span>"}${currentStep === "review" ? '<button class="primary-action" type="button" data-action="apply-progression">Aplicar evolução</button>' : '<button class="primary-action" type="button" data-action="progression-step-next">Continuar →</button>'}</footer></section></section></main>`;
}

function renderProgressionStep(step: ProgressionFlowStep, character: Character, dependencies: ProgressionRenderDependencies): string {
  switch (step) {
    case "advances":
      return `<p class="progression-stage-copy">Escolha como o personagem evolui. Alguns avanços ocupam os dois espaços desta passagem de nível.</p><div class="progression-elective-panel">${dependencies.renderProgressionOptions(character)}</div>${dependencies.renderProgressionAdvanceSummary()}`;
    case "domain-card":
      return `<p class="progression-stage-copy">A carta aprendida será guardada no Vault. Você decide depois quando ativá-la no Loadout.</p>${dependencies.renderProgressionDomainStep(character)}`;
    case "tier-experience":
      return `<p class="progression-stage-copy">Este nível inaugura um novo Tier. Registre a Experiência +2 que representa esse marco.</p>${dependencies.renderTierExperienceStep(character)}`;
    case "review":
      return `<p class="progression-stage-copy">Revise as escolhas antes de aplicá-las definitivamente à ficha.</p>${dependencies.renderProgressionReview(character)}`;
  }
}
