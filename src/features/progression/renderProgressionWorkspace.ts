import type { CardDefinition, Character, ProgressionAdvanceKind } from "../../domain/types";
import type { ProgressionDraftChoice, ProgressionTierNumber } from "../../app/types";
import { getProgressionChoiceCost, progressionAdvanceLabels, progressionAdvanceRules } from "./progressionRules";

export type ProgressionWorkspaceState = {
  progressionDraft: ProgressionDraftChoice[];
  progressionTierExperience?: { name: string; description: string };
  progressionCardId?: string;
  progressionSwapFromCardId?: string;
  progressionSwapToCardId?: string;
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
    { kind: "proficiency", description: "Ganhe +1 em Proficiência. Usa todos os avanços deste nível.", disabled: usedChoices > 0 },
    { kind: "multiclass", description: "Escolha outra classe, um Domínio, uma característica e uma Fundação. Usa todos os avanços deste nível.", disabled: hasSubclassDraft || !canChooseMulticlass(character, tier) || usedChoices > 0 }
  ];
  return `<section class="progression-tier-options"><h3>Avanços disponíveis</h3><div class="progression-option-list">${options.filter((option) => progressionAdvanceRules[option.kind].slotCount[tier] > 0).map((option) => renderProgressionOption(option, character, tier, usedChoices, dependencies)).join("")}</div></section>`;
}

export function renderProgressionAdvanceSummary(dependencies: ProgressionWorkspaceDependencies): string {
  const { state, escapeHtml, getProgressionChoiceCount } = dependencies;
  const choiceCount = getProgressionChoiceCount();
  const choices = state.progressionDraft.length
    ? `<ul>${state.progressionDraft.map((choice, index) => `<li><span>${escapeHtml(choice.label)}</span><button type="button" data-action="remove-progression-choice" data-progression-choice-index="${index}" aria-label="Remover ${escapeHtml(choice.label)}">x</button></li>`).join("")}</ul>`
    : "";
  return `<section class="progression-advance-summary"><div><strong>Avanços preparados</strong><span><b>${choiceCount} / 2</b> avanços</span></div>${choices}</section>`;
}

export function renderProgressionDomainStep(character: Character, dependencies: ProgressionWorkspaceDependencies): string {
  const { state, escapeHtml, getProgressionCardCandidates, findCard } = dependencies;
  const candidates = getProgressionCardCandidates(character);
  const selectedCard = state.progressionCardId ? findCard(state.progressionCardId) : undefined;
  const hasRequiredCard = Boolean(selectedCard);
  const cardStatus = candidates.length ? "Pendente: escolha uma carta elegível." : "Nenhuma carta elegível encontrada nos Domínios da classe.";
  const selectedCardPreview = selectedCard ? `<div class="progression-selected-card" aria-label="Carta selecionada: ${escapeHtml(selectedCard.name)}"><span class="progression-selected-card-art">${selectedCard.image ? `<img src="${escapeHtml(selectedCard.image)}" alt="" />` : "DOM"}</span><strong title="${escapeHtml(selectedCard.name)}">${escapeHtml(selectedCard.name)}</strong></div>` : `<p>${escapeHtml(cardStatus)}</p>`;
  return `<aside class="progression-domain-card-step ${hasRequiredCard ? "is-complete" : "is-pending"}" aria-label="Carta obrigatória de Domínio"><div class="progression-step-heading"><strong>Carta de Domínio</strong></div>${selectedCardPreview}<button class="sf-action ${hasRequiredCard ? "sf-action--secondary secondary-action" : "sf-action--primary primary-action"}" type="button" data-action="open-progression-card-picker" ${candidates.length ? "" : "disabled"}>${hasRequiredCard ? "Alterar carta" : "Selecionar carta"}</button>${hasRequiredCard ? "<small class=\"progression-card-vault-note\">A carta será aprendida no Vault. Ative-a no Loadout quando quiser usá-la.</small>" : ""}</aside>`;
}

export function renderProgressionCardSwapStep(_character: Character, dependencies: ProgressionWorkspaceDependencies): string {
  const { state, escapeHtml, findCard } = dependencies;
  const fromCard = state.progressionSwapFromCardId ? findCard(state.progressionSwapFromCardId) : undefined;
  const toCard = state.progressionSwapToCardId ? findCard(state.progressionSwapToCardId) : undefined;
  const prepared = Boolean(fromCard && toCard);
  const pending = Boolean(fromCard && !toCard);
  const cards = prepared
    ? `<div class="progression-card-swap-pair">${renderSwapCard(fromCard!, "Sai da coleção", escapeHtml)}<span aria-hidden="true">→</span>${renderSwapCard(toCard!, "Entra no Vault", escapeHtml)}</div>`
    : pending
      ? `<div class="progression-card-swap-pair is-pending">${renderSwapCard(fromCard!, "Sai da coleção", escapeHtml)}<span aria-hidden="true">→</span><div class="progression-card-swap-empty"><strong>Escolha a nova carta</strong><span>Ela deve ser elegível e de nível igual ou inferior.</span></div></div>`
    : `<div class="progression-card-swap-empty"><strong>Manter cartas atuais</strong><span>Nenhuma carta será removida da coleção.</span></div>`;
  const primaryAction = pending ? "open-progression-swap-target" : "open-progression-swap-source";
  const primaryLabel = prepared ? "Alterar troca" : pending ? "Escolher nova carta" : "Trocar uma carta";
  return `<section class="progression-card-swap-step ${prepared ? "is-prepared" : ""}" aria-label="Troca opcional de carta"><div class="progression-step-heading"><strong>Troca de carta</strong><span>Opcional</span></div>${cards}<div class="progression-card-swap-actions"><button class="sf-action ${prepared ? "sf-action--secondary secondary-action" : "sf-action--primary primary-action"}" type="button" data-action="${primaryAction}">${primaryLabel}</button>${prepared || pending ? '<button class="sf-action sf-action--ghost" type="button" data-action="clear-progression-card-swap">Manter cartas atuais</button>' : ""}</div></section>`;
}

export function renderTierExperienceStep(_character: Character, dependencies: ProgressionWorkspaceDependencies): string {
  const { state, escapeHtml } = dependencies;
  const experience = state.progressionTierExperience;
  const isDefined = Boolean(experience?.name.trim());
  return `<section class="progression-tier-experience-step ${isDefined ? "is-defined" : ""}" aria-label="Experiência de Tier"><div><strong>Experiência de Tier +2</strong><span>${isDefined ? escapeHtml(experience?.name ?? "") : "Defina a nova Experiência recebida ao entrar neste Tier."}</span></div><button class="sf-action ${isDefined ? "sf-action--secondary secondary-action" : "sf-action--primary primary-action"}" type="button" data-action="open-tier-experience">${isDefined ? "Alterar experiência" : "Definir experiência"}</button></section>`;
}

export function renderProgressionReview(_character: Character, dependencies: ProgressionWorkspaceDependencies): string {
  const { state, escapeHtml, findCard } = dependencies;
  const card = state.progressionCardId ? findCard(state.progressionCardId) : undefined;
  const experience = state.progressionTierExperience;
  const fromCard = state.progressionSwapFromCardId ? findCard(state.progressionSwapFromCardId) : undefined;
  const toCard = state.progressionSwapToCardId ? findCard(state.progressionSwapToCardId) : undefined;
  const swap = fromCard && toCard ? `Troca opcional: ${escapeHtml(fromCard.name)} → ${escapeHtml(toCard.name)} (Vault)` : "Troca opcional: cartas atuais mantidas.";
  return `<section class="progression-review" aria-label="Resumo da evolução"><h3>Escolhas preparadas</h3><ul>${state.progressionDraft.map((choice) => `<li>${escapeHtml(choice.label)}</li>`).join("") || "<li>Nenhum avanço selecionado.</li>"}${card ? `<li>Carta de Domínio: ${escapeHtml(card.name)} → Vault</li>` : "<li>Carta de Domínio não selecionada.</li>"}<li>${swap}</li>${experience?.name ? `<li>Experiência de Tier +2: ${escapeHtml(experience.name)}</li>` : ""}</ul><p>Ao aplicar, o nível, os recursos e as escolhas desta ficha serão atualizados.</p></section>`;
}

function renderSwapCard(card: CardDefinition, label: string, escapeHtml: (value: string) => string): string {
  return `<article class="progression-card-swap-card"><span>${card.image ? `<img src="${escapeHtml(card.image)}" alt="" />` : "DOM"}</span><div><small>${label}</small><strong>${escapeHtml(card.name)}</strong><em>Nível ${card.tier}</em></div></article>`;
}

function renderProgressionOption(option: { kind: ProgressionAdvanceKind; description: string; disabled?: boolean }, character: Character, tier: ProgressionTierNumber, usedChoices: number, dependencies: ProgressionWorkspaceDependencies): string {
  const { escapeHtml, getAdvanceSlotsUsed } = dependencies;
  const rule = progressionAdvanceRules[option.kind];
  const slots = rule.slotCount[tier];
  const slotsUsed = getAdvanceSlotsUsed(character, tier, option.kind);
  const cost = getProgressionChoiceCost(option.kind);
  const lacksChoices = Math.max(0, 2 - usedChoices) < cost;
  const disabled = Boolean(option.disabled) || tier < rule.minimumTier || slotsUsed >= slots || lacksChoices;
  const costLabel = `${cost} ${cost === 1 ? "avanço" : "avanços"}`;
  const usageLabel = `${slotsUsed} de ${slots} ${slots === 1 ? "uso" : "usos"} no Tier`;
  const optionClass = ["progression-option", cost === 2 ? "is-full-level-cost" : "", slotsUsed > 0 ? "is-selected" : ""].filter(Boolean).join(" ");
  const usageBoxes = Array.from({ length: slots }, (_, slotIndex) => {
    const used = slotIndex < slotsUsed;
    return `<span class="${["progression-advance-use", used ? "is-used" : ""].filter(Boolean).join(" ")}">${Array.from({ length: cost }, () => `<i class="progression-advance-box" aria-hidden="true">${used ? "✓" : ""}</i>`).join("")}</span>`;
  }).join("");
  return `<button class="${optionClass}" type="button" data-action="select-progression-advance" data-progression-advance="${option.kind}" data-progression-tier="${tier}" ${disabled ? "disabled" : ""}><span class="progression-option-body"><span class="progression-option-heading"><strong>${escapeHtml(progressionAdvanceLabels[option.kind])}</strong><span class="progression-option-cost" aria-label="Custo: ${costLabel}"><b aria-hidden="true">${"◆".repeat(cost)}</b><em>Custo: ${costLabel}</em></span></span><em>${escapeHtml(option.description)}</em><span class="progression-option-usage"><small>${usageLabel}</small><span class="progression-advance-uses" role="img" aria-label="${usageLabel}; cada uso custa ${costLabel}">${usageBoxes}</span></span></span></button>`;
}
