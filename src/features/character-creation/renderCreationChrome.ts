import { isFinalCharacterCreationStep, type CharacterCreationStep } from "./creationFlow";

export type CreationChromeState = {
  step: CharacterCreationStep;
  nextDisabled?: boolean;
  nextDescribedBy?: string;
};

const steps = ["Identidade", "Ancestralidades", "Features", "Comunidade", "Classe", "Atributos", "Cartas", "Experiências", "Revisão"];
const titles = ["", "", "Ancestralidades", "Features", "Comunidade", "Classe", "Atributos", "Cartas de Domínio", "Experiências", "Revisão"];

export function renderCreationProgress(state: CreationChromeState): string {
  return `<div class="character-creation-progress" aria-label="Etapa ${state.step} de ${steps.length}">${steps.map((label, index) => `<span class="${index + 1 === state.step ? "is-current" : index + 1 < state.step ? "is-complete" : ""}">${index + 1}. ${label}</span>`).join("")}</div>`;
}

export function renderCreationTitle(state: CreationChromeState): string {
  return `<div class="modal-title"><span>Nova ficha${state.step > 1 ? ` · Etapa ${state.step} de ${steps.length}` : ""}</span><h2 id="character-creation-title">${state.step === 1 ? "Criar personagem" : titles[state.step]}</h2>${state.step === 1 ? "<p>Comece com o essencial. Os demais detalhes podem ser definidos durante a jornada.</p>" : ""}</div>`;
}

export function renderCreationActions(state: CreationChromeState): string {
  const nextAction = isFinalCharacterCreationStep(state.step)
    ? '<button class="sf-action sf-action--primary" type="button" data-action="save-new-character">Criar ficha</button>'
    : `<button class="sf-action sf-action--primary sf-action--icon character-creation-arrow" type="button" data-action="character-creation-next" aria-label="Avançar para a próxima etapa" title="Continuar" ${state.nextDisabled ? "disabled" : ""}${state.nextDescribedBy ? ` aria-describedby="${state.nextDescribedBy}"` : ""}>→</button>`;
  return `<div class="modal-actions character-creation-actions">${state.step > 1 ? '<button class="sf-action sf-action--secondary sf-action--icon character-creation-arrow" type="button" data-action="character-creation-previous" aria-label="Voltar à etapa anterior" title="Voltar">←</button>' : "<span></span>"}${nextAction}</div>`;
}
