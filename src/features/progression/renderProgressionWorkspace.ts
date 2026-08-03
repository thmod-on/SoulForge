import type { CardDefinition, Character, ProgressionAdvanceKind } from "../../domain/types";
import type { ProgressionDraftChoice, ProgressionTierNumber } from "../../app/types";
import { progressionAdvanceLabels, progressionAdvanceRules } from "./progressionRules";

export type ProgressionWorkspaceState = {
  progressionDraft: ProgressionDraftChoice[];
  progressionTierExperience?: { name: string; description: string };
  progressionCardId?: string;
  progressionCardDestination: "loadout" | "vault";
  progressionError?: string;
};

export type ProgressionWorkspaceDependencies = {
  state: ProgressionWorkspaceState;
  escapeHtml: (value: string) => string;
  getTierForLevel: (level: number) => ProgressionTierNumber;
  getProgressionChoiceCount: () => number;
  getAdvanceSlotsUsed: (character: Character, tier: ProgressionTierNumber, kind: ProgressionAdvanceKind) => number;
  getNextSubclassAdvance: (character: Character, tier: ProgressionTierNumber) => "specialized" | "mastery" | undefined;
  requiresTierExperience: (character: Character) => boolean;
  getProgressionCardCandidates: (character: Character) => CardDefinition[];
  getActiveCards: (character: Character) => CardDefinition[];
  findCard: (cardId: string) => CardDefinition | undefined;
};

export function renderProgressionOptions(character: Character, isCurrentTier: boolean, dependencies: ProgressionWorkspaceDependencies): string {
  const { getProgressionChoiceCount, getTierForLevel, getNextSubclassAdvance } = dependencies;
  const usedChoices = getProgressionChoiceCount();
  const currentTier = getTierForLevel(Math.min(character.identity.level + 1, 10));
  const tiers = ([2, 3, 4] as ProgressionTierNumber[]).filter((tier) => tier <= currentTier);
  return tiers.map((tier) => {
    const subclassAdvance = getNextSubclassAdvance(character, tier);
    const options: Array<{ kind: ProgressionAdvanceKind; description: string; disabled?: boolean }> = [
      { kind: "attributes", description: "Ganhe +1 em dois atributos ainda nao marcados." },
      { kind: "hp", description: "Ganhe permanentemente um slot de PV." },
      { kind: "stress", description: "Ganhe permanentemente um slot de Estresse." },
      { kind: "experiences", description: "Ganhe +1 em duas Experiencias." },
      { kind: "domain", description: "Escolha uma carta adicional de Dominio." },
      { kind: "evasion", description: "Ganhe permanentemente +1 em Evasao." },
      { kind: "subclass", description: subclassAdvance ? `Receba ${subclassAdvance === "specialized" ? "a Especializacao" : "a Maestria"} da subclasse.` : "A proxima feature da subclasse nao esta disponivel neste Tier.", disabled: !subclassAdvance },
      { kind: "proficiency", description: "Ganhe +1 em Proficiencia. Consome as duas escolhas.", disabled: usedChoices > 0 }
    ];
    return `<section class="progression-tier-options"><h3>Espacos do Tier ${tier}${tier === currentTier ? "" : " (pendentes)"}</h3><div class="progression-option-list">${options.filter((option) => progressionAdvanceRules[option.kind].slotCount[tier] > 0).map((option) => renderProgressionOption(option, character, tier, isCurrentTier, usedChoices, dependencies)).join("")}</div></section>`;
  }).join("");
}

export function renderProgressionDraft(character: Character, dependencies: ProgressionWorkspaceDependencies): string {
  const { state, escapeHtml, getProgressionChoiceCount, requiresTierExperience } = dependencies;
  const choiceCount = getProgressionChoiceCount();
  const choices = state.progressionDraft.length ? state.progressionDraft.map((choice, index) => `<li><span>${escapeHtml(choice.label)}</span><button type="button" data-action="remove-progression-choice" data-progression-choice-index="${index}" aria-label="Remover ${escapeHtml(choice.label)}">x</button></li>`).join("") : "<li><span>Nenhuma escolha preparada.</span></li>";
  const needsTierExperience = requiresTierExperience(character);
  const hasTierExperience = Boolean(state.progressionTierExperience?.name.trim());
  const canConfirm = choiceCount === 2 && Boolean(state.progressionCardId) && (!needsTierExperience || hasTierExperience);
  const pendingRequirements = [choiceCount < 2 ? `Falta${2 - choiceCount === 1 ? "" : "m"} ${2 - choiceCount} escolha${2 - choiceCount === 1 ? "" : "s"}` : "", !state.progressionCardId ? "selecione a carta de Dominio" : "", needsTierExperience && !hasTierExperience ? "defina a Experiencia de Tier" : ""].filter(Boolean);
  return `<section class="progression-draft" aria-label="Avancos preparados"><div><strong>Avancos preparados</strong><span>${choiceCount} / 2 escolhas</span></div><ul>${choices}</ul>${renderTierExperienceStep(character, dependencies)}${state.progressionError ? `<p class="progression-feedback" role="alert">${escapeHtml(state.progressionError)}</p>` : ""}<div class="progression-draft-footer"><span>${canConfirm ? "Requisitos preenchidos. Revise antes de confirmar." : `${pendingRequirements.join("; ")}.`}</span><button class="${canConfirm ? "primary-action" : "secondary-action progression-confirm-action is-incomplete"}" type="button" data-action="open-progression-confirmation">Confirmar evolucao</button></div></section>`;
}

export function renderProgressionDomainStep(character: Character, dependencies: ProgressionWorkspaceDependencies): string {
  const { state, escapeHtml, getProgressionCardCandidates, getActiveCards, findCard } = dependencies;
  const candidates = getProgressionCardCandidates(character);
  const selectedCard = state.progressionCardId ? findCard(state.progressionCardId) : undefined;
  const hasRequiredCard = Boolean(selectedCard);
  const canUseLoadout = getActiveCards(character).length < 5;
  const cardStatus = candidates.length ? "Pendente: escolha uma carta elegivel." : "Nenhuma carta elegivel encontrada nos Dominios da classe.";
  const selectedCardPreview = selectedCard ? `<div class="progression-selected-card" aria-label="Carta selecionada: ${escapeHtml(selectedCard.name)}"><span class="progression-selected-card-art">${selectedCard.image ? `<img src="${escapeHtml(selectedCard.image)}" alt="" />` : "DOM"}</span><strong title="${escapeHtml(selectedCard.name)}">${escapeHtml(selectedCard.name)}</strong></div>` : `<p>${escapeHtml(cardStatus)}</p>`;
  return `<aside class="progression-domain-card-step ${hasRequiredCard ? "is-complete" : "is-pending"}" aria-label="Carta obrigatoria de Dominio"><div class="progression-step-heading"><strong>Carta de Dominio</strong></div>${selectedCardPreview}<button class="${hasRequiredCard ? "secondary-action" : "primary-action"}" type="button" data-action="open-progression-card-picker" ${candidates.length ? "" : "disabled"}>${hasRequiredCard ? "Alterar carta" : "Selecionar carta"}</button>${hasRequiredCard ? `<div class="progression-card-destination"><button class="${state.progressionCardDestination === "loadout" ? "is-selected" : ""}" type="button" data-action="set-progression-card-destination" data-progression-card-destination="loadout" ${canUseLoadout ? "" : "disabled"}>Loadout</button><button class="${state.progressionCardDestination === "vault" ? "is-selected" : ""}" type="button" data-action="set-progression-card-destination" data-progression-card-destination="vault">Vault</button></div>` : ""}</aside>`;
}

function renderTierExperienceStep(character: Character, dependencies: ProgressionWorkspaceDependencies): string {
  const { state, escapeHtml, requiresTierExperience } = dependencies;
  if (!requiresTierExperience(character)) return "";
  const experience = state.progressionTierExperience;
  const isDefined = Boolean(experience?.name.trim());
  return `<section class="progression-tier-experience-step ${isDefined ? "is-defined" : ""}" aria-label="Experiencia de Tier"><div><strong>Experiencia de Tier +2</strong><span>${isDefined ? escapeHtml(experience?.name ?? "") : "Defina a nova Experiencia recebida ao entrar neste Tier."}</span></div><button class="${isDefined ? "secondary-action" : "primary-action"}" type="button" data-action="open-tier-experience">${isDefined ? "Alterar experiencia" : "Definir experiencia"}</button></section>`;
}

function renderProgressionOption(option: { kind: ProgressionAdvanceKind; description: string; disabled?: boolean }, character: Character, tier: ProgressionTierNumber, isCurrentTier: boolean, usedChoices: number, dependencies: ProgressionWorkspaceDependencies): string {
  const { escapeHtml, getAdvanceSlotsUsed } = dependencies;
  const cost = option.kind === "proficiency" ? 2 : 1;
  const rule = progressionAdvanceRules[option.kind];
  const slots = rule.slotCount[tier];
  const slotsUsed = getAdvanceSlotsUsed(character, tier, option.kind);
  const disabled = !isCurrentTier || Boolean(option.disabled) || tier < rule.minimumTier || slotsUsed >= slots || usedChoices + cost > 2;
  return `<button class="progression-option" type="button" data-action="select-progression-advance" data-progression-advance="${option.kind}" data-progression-tier="${tier}" ${disabled ? "disabled" : ""}><i aria-hidden="true"></i><span><strong>${escapeHtml(progressionAdvanceLabels[option.kind])}</strong>${escapeHtml(option.description)}<small>Espacos: ${slotsUsed} / ${slots}</small></span></button>`;
}
