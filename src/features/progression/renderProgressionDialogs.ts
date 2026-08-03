import type { CardDefinition, Character } from "../../domain/types";
import type { ProgressionDraftChoice, ProgressionPicker, ProgressionTierNumber } from "../../app/types";

export type ProgressionDialogState = {
  character?: Character;
  progressionHistoryOpen: boolean;
  progressionPicker?: ProgressionPicker;
  progressionPickerTier?: ProgressionTierNumber;
  progressionPickerIds: string[];
  progressionDraft: ProgressionDraftChoice[];
  progressionCardPickerMode?: "mandatory" | "advance";
  progressionCardId?: string;
  progressionTierExperienceOpen: boolean;
  progressionTierExperience?: { name: string; description: string };
  progressionTierExperienceError?: string;
  progressionConfirmationOpen: boolean;
  progressionCardDestination: "loadout" | "vault";
};

export type ProgressionDialogDependencies = {
  state: ProgressionDialogState;
  escapeHtml: (value: string) => string;
  attributeTitle: (label: string) => string;
  getTierForLevel: (level: number) => ProgressionTierNumber;
  getProgression: (character: Character) => Character["progression"] & { attributeMarks: Record<string, string[]> };
  getProgressionCardCandidates: (character: Character) => CardDefinition[];
  requiresTierExperience: (character: Character) => boolean;
  findCard: (cardId: string) => CardDefinition | undefined;
  findDomainName: (domainId: string) => string | undefined;
};

export function renderProgressionHistoryModal(dependencies: ProgressionDialogDependencies): string {
  const { state, escapeHtml, getProgression } = dependencies;
  if (!state.progressionHistoryOpen) return "";
  const history = state.character ? getProgression(state.character).history : [];
  const entries = history.length ? history.map((entry) => `<li class="progression-history-entry"><strong>Nivel ${entry.level}</strong><ul>${entry.tierAchievement ? `<li class="tier-achievement">${escapeHtml(entry.tierAchievement)}</li>` : ""}${entry.choices.map((choice) => `<li>${escapeHtml(choice)}</li>`).join("")}</ul></li>`).join("") : "<li class=\"progression-history-entry\"><strong>Sem evolucoes</strong><span>Nenhuma escolha foi aplicada ainda.</span></li>";
  return `<div class="modal-backdrop" data-modal-backdrop><section class="progression-history-modal" role="dialog" aria-modal="true" aria-labelledby="progression-history-title"><button class="modal-close" data-modal-close aria-label="Fechar historico">x</button><span class="resource-modal-label">Progressao</span><h2 id="progression-history-title">Historico de escolhas</h2><ol>${entries}</ol><p>As escolhas confirmadas ficam registradas nesta ficha.</p></section></div>`;
}

export function renderProgressionPickerModal(dependencies: ProgressionDialogDependencies): string {
  const { state, escapeHtml, attributeTitle, getTierForLevel, getProgression } = dependencies;
  const character = state.character;
  const picker = state.progressionPicker;
  if (!character || !picker) return "";
  const tier = getTierForLevel(Math.min(character.identity.level + 1, 10));
  const marked = getProgression(character).attributeMarks[String(state.progressionPickerTier ?? tier)] ?? [];
  const draftAttributeIds = state.progressionDraft.flatMap((choice) => choice.attributeIds ?? []);
  const candidates = picker === "attributes" ? character.attributes.filter((attribute) => !marked.includes(attribute.id) && !draftAttributeIds.includes(attribute.id)).map((attribute) => ({ id: attribute.id, label: attributeTitle(attribute.label), detail: `Atual: ${attribute.value}` })) : character.experiences.map((experience) => ({ id: experience.id, label: experience.name, detail: `Atual: +${experience.value}` }));
  const title = picker === "attributes" ? "Escolha dois atributos" : "Escolha duas Experiencias";
  return `<div class="modal-backdrop" data-modal-backdrop><section class="progression-picker-modal" role="dialog" aria-modal="true" aria-labelledby="progression-picker-title"><button class="modal-close" data-modal-close aria-label="Fechar escolha">x</button><span class="resource-modal-label">Progressao</span><h2 id="progression-picker-title">${title}</h2><p>Selecione 2 opcoes para este avanço.</p><div class="progression-picker-list">${candidates.map((candidate) => `<button type="button" class="${state.progressionPickerIds.includes(candidate.id) ? "is-selected" : ""}" data-action="toggle-progression-picker" data-progression-picker-id="${candidate.id}"><strong>${escapeHtml(candidate.label)}</strong><span>${escapeHtml(candidate.detail)}</span></button>`).join("")}</div><button class="primary-action" type="button" data-action="confirm-progression-picker" ${state.progressionPickerIds.length !== 2 ? "disabled" : ""}>Adicionar avanço</button></section></div>`;
}

export function renderProgressionCardPickerModal(dependencies: ProgressionDialogDependencies): string {
  const { state, escapeHtml, getProgressionCardCandidates, findDomainName } = dependencies;
  const character = state.character;
  if (!character || !state.progressionCardPickerMode) return "";
  const cards = getProgressionCardCandidates(character);
  return `<div class="modal-backdrop" data-modal-backdrop><section class="progression-picker-modal progression-card-picker-modal" role="dialog" aria-modal="true" aria-labelledby="progression-card-picker-title"><button class="modal-close" data-modal-close aria-label="Fechar escolha de carta">x</button><span class="resource-modal-label">${state.progressionCardPickerMode === "mandatory" ? "Carta obrigatoria" : "Avanco opcional"}</span><h2 id="progression-card-picker-title">Escolha uma carta de Dominio</h2><p>Somente cartas dos Dominios da classe e de nivel permitido aparecem aqui.</p><div class="progression-card-choice-list">${cards.map((card) => `<button class="${state.progressionCardId === card.id ? "is-selected" : ""}" type="button" data-action="select-progression-card" data-progression-card-id="${card.id}"><span class="progression-card-choice-art">${card.image ? `<img src="${escapeHtml(card.image)}" alt="" />` : ""}</span><span><strong>${escapeHtml(card.name)}</strong><small>${escapeHtml(findDomainName(card.domainId) ?? "Dominio")} · Tier ${card.tier}</small><em>${escapeHtml(card.summary)}</em></span></button>`).join("")}</div></section></div>`;
}

export function renderTierExperienceModal(dependencies: ProgressionDialogDependencies): string {
  const { state, escapeHtml } = dependencies;
  if (!state.progressionTierExperienceOpen) return "";
  const experience = state.progressionTierExperience;
  return `<div class="modal-backdrop" data-modal-backdrop><section class="progression-picker-modal tier-experience-modal" role="dialog" aria-modal="true" aria-labelledby="tier-experience-title"><button class="modal-close" data-modal-close aria-label="Fechar experiencia de Tier">x</button><span class="resource-modal-label">Conquista de Tier</span><h2 id="tier-experience-title">Nova Experiencia +2</h2><p>Escolha uma experiencia que represente o marco alcançado pelo personagem.</p><label class="form-field"><span>Nome *</span><input data-tier-experience-name value="${escapeHtml(experience?.name ?? "")}" placeholder="Ex.: Defensor das muralhas" /></label><label class="form-field"><span>Descricao</span><textarea data-tier-experience-description placeholder="Como essa experiencia ajuda o personagem?">${escapeHtml(experience?.description ?? "")}</textarea></label>${state.progressionTierExperienceError ? `<p class="form-error">${escapeHtml(state.progressionTierExperienceError)}</p>` : ""}<button class="primary-action" type="button" data-action="save-tier-experience">Definir experiencia +2</button></section></div>`;
}

export function renderProgressionConfirmationModal(dependencies: ProgressionDialogDependencies): string {
  const { state, escapeHtml, requiresTierExperience, findCard } = dependencies;
  const character = state.character;
  if (!state.progressionConfirmationOpen || !character) return "";
  const nextLevel = Math.min(character.identity.level + 1, 10);
  const tierAchievement = [2, 5, 8].includes(nextLevel) ? "Conquista do Tier: nova Experiencia +2 e Proficiencia +1." : "Sem conquista automatica de Tier neste nivel.";
  const tierExperience = requiresTierExperience(character) ? state.progressionTierExperience : undefined;
  const selectedCard = state.progressionCardId ? findCard(state.progressionCardId) : undefined;
  return `<div class="modal-backdrop" data-modal-backdrop><section class="progression-picker-modal" role="dialog" aria-modal="true" aria-labelledby="progression-confirmation-title"><button class="modal-close" data-modal-close aria-label="Cancelar evolucao">x</button><span class="resource-modal-label">Confirmar evolucao</span><h2 id="progression-confirmation-title">Nivel ${character.identity.level} para ${nextLevel}</h2><p>${tierAchievement}</p>${tierExperience ? `<p><strong>Experiencia de Tier +2:</strong> ${escapeHtml(tierExperience.name)}</p>` : ""}<ul class="progression-confirmation-list">${state.progressionDraft.map((choice) => `<li>${escapeHtml(choice.label)}</li>`).join("")}${selectedCard ? `<li>Carta de Dominio: ${escapeHtml(selectedCard.name)} → ${state.progressionCardDestination === "loadout" ? "Loadout" : "Vault"}</li>` : ""}</ul><div class="confirmation-actions"><button class="secondary-action" type="button" data-modal-close>Voltar</button><button class="primary-action" type="button" data-action="apply-progression">Aplicar evolucao</button></div></section></div>`;
}
