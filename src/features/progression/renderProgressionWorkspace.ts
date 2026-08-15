import type { CardDefinition, Character, ProgressionAdvanceKind } from "../../domain/types";
import type { ProgressionDraftChoice, ProgressionTierNumber } from "../../app/types";
import { progressionAdvanceLabels, progressionAdvanceRules } from "./progressionRules";

export type ProgressionWorkspaceState = {
  progressionDraft: ProgressionDraftChoice[];
  progressionTierExperience?: { name: string; description: string };
  progressionCardId?: string;
};

export type ProgressionWorkspaceDependencies = {
  state: ProgressionWorkspaceState;
  escapeHtml: (value: string) => string;
  getTierForLevel: (level: number) => ProgressionTierNumber;
  getProgressionChoiceCount: () => number;
  getAdvanceSlotsUsed: (character: Character, tier: ProgressionTierNumber, kind: ProgressionAdvanceKind) => number;
  getNextSubclassAdvance: (character: Character, tier: ProgressionTierNumber) => "specialized" | "mastery" | undefined;
  canChooseMulticlass: (character: Character, tier: ProgressionTierNumber) => boolean;
  getProgressionCardCandidates: (character: Character) => CardDefinition[];
  findCard: (cardId: string) => CardDefinition | undefined;
};

export function renderProgressionOptions(character: Character, dependencies: ProgressionWorkspaceDependencies): string {
  const { getProgressionChoiceCount, getTierForLevel, getNextSubclassAdvance, canChooseMulticlass } = dependencies;
  const usedChoices = getProgressionChoiceCount();
  const tier = getTierForLevel(Math.min(character.identity.level + 1, 10));
  const subclassAdvance = getNextSubclassAdvance(character, tier);
  const hasSubclassDraft = dependencies.state.progressionDraft.some((choice) => choice.kind === "subclass" && choice.tier === tier);
  const options: Array<{ kind: ProgressionAdvanceKind; description: string; disabled?: boolean }> = [
    { kind: "attributes", description: "Ganhe +1 em dois atributos ainda não marcados." },
    { kind: "hp", description: "Ganhe permanentemente um slot de PV." },
    { kind: "stress", description: "Ganhe permanentemente um slot de Estresse." },
    { kind: "experiences", description: "Ganhe +1 em duas Experiências." },
    { kind: "domain", description: "Escolha uma carta adicional de Domínio." },
    { kind: "evasion", description: "Ganhe permanentemente +1 em Evasão." },
    { kind: "subclass", description: subclassAdvance ? `Receba ${subclassAdvance === "specialized" ? "a Especialização" : "a Maestria"} da subclasse.` : "A próxima feature da subclasse não está disponível neste Tier.", disabled: !subclassAdvance },
    { kind: "proficiency", description: "Ganhe +1 em Proficiência. Consome as duas escolhas.", disabled: usedChoices > 0 },
    { kind: "multiclass", description: "Escolha outra classe, um Domínio, uma característica e uma Fundação. Consome as duas escolhas.", disabled: hasSubclassDraft || !canChooseMulticlass(character, tier) || usedChoices > 0 }
  ];
  return `<section class="progression-tier-options"><h3>Escolhas do Tier ${tier}</h3><div class="progression-option-list">${options.filter((option) => progressionAdvanceRules[option.kind].slotCount[tier] > 0).map((option) => renderProgressionOption(option, character, tier, usedChoices, dependencies)).join("")}</div></section>`;
}

export function renderProgressionAdvanceSummary(dependencies: ProgressionWorkspaceDependencies): string {
  const { state, escapeHtml, getProgressionChoiceCount } = dependencies;
  const choiceCount = getProgressionChoiceCount();
  const choices = state.progressionDraft.length
    ? state.progressionDraft.map((choice, index) => `<li><span>${escapeHtml(choice.label)}</span><button type="button" data-action="remove-progression-choice" data-progression-choice-index="${index}" aria-label="Remover ${escapeHtml(choice.label)}">x</button></li>`).join("")
    : "<li><span>Nenhuma escolha preparada.</span></li>";
  return `<section class="progression-advance-summary"><div><strong>Avanços preparados</strong><span>${choiceCount} / 2 escolhas</span></div><ul>${choices}</ul><small>${choiceCount === 2 ? "As duas escolhas foram definidas. Você pode continuar." : "Escolha os avanços antes de continuar."}</small></section>`;
}

export function renderProgressionDomainStep(character: Character, dependencies: ProgressionWorkspaceDependencies): string {
  const { state, escapeHtml, getProgressionCardCandidates, findCard } = dependencies;
  const candidates = getProgressionCardCandidates(character);
  const selectedCard = state.progressionCardId ? findCard(state.progressionCardId) : undefined;
  const hasRequiredCard = Boolean(selectedCard);
  const cardStatus = candidates.length ? "Pendente: escolha uma carta elegível." : "Nenhuma carta elegível encontrada nos Domínios da classe.";
  const selectedCardPreview = selectedCard ? `<div class="progression-selected-card" aria-label="Carta selecionada: ${escapeHtml(selectedCard.name)}"><span class="progression-selected-card-art">${selectedCard.image ? `<img src="${escapeHtml(selectedCard.image)}" alt="" />` : "DOM"}</span><strong title="${escapeHtml(selectedCard.name)}">${escapeHtml(selectedCard.name)}</strong></div>` : `<p>${escapeHtml(cardStatus)}</p>`;
  return `<aside class="progression-domain-card-step ${hasRequiredCard ? "is-complete" : "is-pending"}" aria-label="Carta obrigatória de Domínio"><div class="progression-step-heading"><strong>Carta de Domínio</strong></div>${selectedCardPreview}<button class="${hasRequiredCard ? "secondary-action" : "primary-action"}" type="button" data-action="open-progression-card-picker" ${candidates.length ? "" : "disabled"}>${hasRequiredCard ? "Alterar carta" : "Selecionar carta"}</button>${hasRequiredCard ? "<small class=\"progression-card-vault-note\">A carta será aprendida no Vault. Ative-a no Loadout quando quiser usá-la.</small>" : ""}</aside>`;
}

export function renderTierExperienceStep(_character: Character, dependencies: ProgressionWorkspaceDependencies): string {
  const { state, escapeHtml } = dependencies;
  const experience = state.progressionTierExperience;
  const isDefined = Boolean(experience?.name.trim());
  return `<section class="progression-tier-experience-step ${isDefined ? "is-defined" : ""}" aria-label="Experiência de Tier"><div><strong>Experiência de Tier +2</strong><span>${isDefined ? escapeHtml(experience?.name ?? "") : "Defina a nova Experiência recebida ao entrar neste Tier."}</span></div><button class="${isDefined ? "secondary-action" : "primary-action"}" type="button" data-action="open-tier-experience">${isDefined ? "Alterar experiência" : "Definir experiência"}</button></section>`;
}

export function renderProgressionReview(_character: Character, dependencies: ProgressionWorkspaceDependencies): string {
  const { state, escapeHtml, findCard } = dependencies;
  const card = state.progressionCardId ? findCard(state.progressionCardId) : undefined;
  const experience = state.progressionTierExperience;
  return `<section class="progression-review" aria-label="Resumo da evolução"><h3>Escolhas preparadas</h3><ul>${state.progressionDraft.map((choice) => `<li>${escapeHtml(choice.label)}</li>`).join("") || "<li>Nenhum avanço selecionado.</li>"}${card ? `<li>Carta de Domínio: ${escapeHtml(card.name)} → Vault</li>` : "<li>Carta de Domínio não selecionada.</li>"}${experience?.name ? `<li>Experiência de Tier +2: ${escapeHtml(experience.name)}</li>` : ""}</ul><p>Ao aplicar, o nível, os recursos e as escolhas desta ficha serão atualizados.</p></section>`;
}

function renderProgressionOption(option: { kind: ProgressionAdvanceKind; description: string; disabled?: boolean }, character: Character, tier: ProgressionTierNumber, usedChoices: number, dependencies: ProgressionWorkspaceDependencies): string {
  const { escapeHtml, getAdvanceSlotsUsed } = dependencies;
  const rule = progressionAdvanceRules[option.kind];
  const slots = rule.slotCount[tier];
  const slotsUsed = getAdvanceSlotsUsed(character, tier, option.kind);
  const cost = option.kind === "proficiency" || option.kind === "multiclass" ? 2 : 1;
  const disabled = Boolean(option.disabled) || tier < rule.minimumTier || slotsUsed >= slots || usedChoices + cost > 2;
  return `<button class="progression-option" type="button" data-action="select-progression-advance" data-progression-advance="${option.kind}" data-progression-tier="${tier}" ${disabled ? "disabled" : ""}><i aria-hidden="true"></i><span><strong>${escapeHtml(progressionAdvanceLabels[option.kind])}</strong>${escapeHtml(option.description)}<small>Espaços: ${slotsUsed} / ${slots}</small></span></button>`;
}
