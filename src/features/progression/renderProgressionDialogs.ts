import type { CardDefinition, Character, ClassDefinition, FeatureDefinition, SubclassDefinition } from "../../domain/types";
import type { ProgressionDraftChoice, ProgressionMulticlassDraft, ProgressionPicker, ProgressionTierNumber } from "../../app/types";

export type ProgressionDialogState = {
  character?: Character;
  progressionHistoryOpen: boolean;
  progressionPicker?: ProgressionPicker;
  progressionPickerTier?: ProgressionTierNumber;
  progressionPickerIds: string[];
  progressionDraft: ProgressionDraftChoice[];
  progressionError?: string;
  progressionCardPickerMode?: "mandatory" | "advance";
  progressionCardTierFilter: "todos" | number;
  progressionCardDomainFilter?: string;
  progressionCardPickerTier?: ProgressionTierNumber;
  progressionCardId?: string;
  progressionCardPickerSelectionId?: string;
  progressionTierExperienceOpen: boolean;
  progressionTierExperience?: { name: string; description: string };
  progressionTierExperienceError?: string;
  progressionMulticlassOpen: boolean;
  progressionMulticlassTier?: ProgressionTierNumber;
  progressionMulticlassDraft: ProgressionMulticlassDraft;
};

export type ProgressionDialogDependencies = {
  state: ProgressionDialogState;
  escapeHtml: (value: string) => string;
  attributeTitle: (label: string) => string;
  getTierForLevel: (level: number) => ProgressionTierNumber;
  getProgression: (character: Character) => Character["progression"] & { attributeMarks: Record<string, string[]> };
  getProgressionCardCandidates: (character: Character) => CardDefinition[];
  getPrimaryDomainIds: (character: Character) => string[];
  requiresTierExperience: (character: Character) => boolean;
  findCard: (cardId: string) => CardDefinition | undefined;
  findDomainName: (domainId: string) => string | undefined;
  getEligibleMulticlassClasses: (character: Character) => ClassDefinition[];
  subclasses: SubclassDefinition[];
  features: FeatureDefinition[];
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
  const { state, escapeHtml, getProgressionCardCandidates, getPrimaryDomainIds, findDomainName } = dependencies;
  const character = state.character;
  if (!character || !state.progressionCardPickerMode) return "";
  const allCards = getProgressionCardCandidates(character);
  const mandatory = state.progressionCardPickerMode === "mandatory";
  const domains = [...new Set([...getPrimaryDomainIds(character), ...allCards.map((card) => card.domainId)])];
  const activeDomainId = domains.includes(state.progressionCardDomainFilter ?? "") ? state.progressionCardDomainFilter : allCards[0]?.domainId ?? domains[0];
  const tiers = [...new Set(allCards.map((card) => card.tier))].sort((a, b) => a - b);
  const cards = allCards.filter((card) => card.domainId === activeDomainId && (state.progressionCardTierFilter === "todos" || card.tier === state.progressionCardTierFilter));
    const domainTabs = `<div class="progression-card-filter-group" role="tablist" aria-label="Filtrar cartas por domínio"><span>Domínio</span>${domains.map((domainId) => `<button class="sf-filter-option ${activeDomainId === domainId ? "is-active" : ""}" type="button" data-action="filter-progression-card-domain" data-progression-card-domain="${escapeHtml(domainId)}" aria-pressed="${activeDomainId === domainId}">${escapeHtml(findDomainName(domainId) ?? "Domínio")}</button>`).join("")}</div>`;
    const levelTabs = `<div class="progression-card-filter-group" role="tablist" aria-label="Filtrar cartas por nível"><span>Nível</span><button class="sf-filter-option ${state.progressionCardTierFilter === "todos" ? "is-active" : ""}" type="button" data-action="filter-progression-card-tier" data-progression-card-tier="todos" aria-pressed="${state.progressionCardTierFilter === "todos"}">Todos</button>${tiers.map((tier) => `<button class="sf-filter-option ${state.progressionCardTierFilter === tier ? "is-active" : ""}" type="button" data-action="filter-progression-card-tier" data-progression-card-tier="${tier}" aria-pressed="${state.progressionCardTierFilter === tier}">${tier}</button>`).join("")}</div>`;
  const selectedCardId = state.progressionCardPickerSelectionId;
  return `<div class="modal-backdrop" data-modal-backdrop><section class="progression-picker-modal progression-card-picker-modal" role="dialog" aria-modal="true" aria-labelledby="progression-card-picker-title"><button class="modal-close" data-modal-close aria-label="Fechar escolha de carta">x</button><span class="resource-modal-label">${mandatory ? "Carta obrigatória" : "Avanço opcional"}</span><h2 id="progression-card-picker-title">Escolha uma carta de Domínio</h2><p class="progression-card-picker-intro">Escolha um domínio e uma carta. Ela será aprendida no Vault.</p><div class="progression-card-filter-row">${domainTabs}${levelTabs}</div><div class="progression-card-choice-list">${cards.map((card) => { const focused = selectedCardId === card.id; return `<button class="${focused ? "is-selected is-focused" : ""}" type="button" data-action="select-progression-card" data-progression-card-id="${card.id}" aria-pressed="${focused}"><span class="progression-card-choice-art">${card.image ? `<img src="${escapeHtml(card.image)}" alt="" />` : ""}</span><span><strong>${escapeHtml(card.name)}</strong><small>${escapeHtml(findDomainName(card.domainId) ?? "Domínio")} · Nível ${card.tier}</small><em>${escapeHtml(card.summary)}</em>${focused ? `<span class="progression-card-choice-details">${escapeHtml(card.effect)}</span><b>Selecionada</b>` : ""}</span></button>`; }).join("") || "<p>Nenhuma carta elegível neste domínio e nível.</p>"}</div><button class="primary-action progression-card-picker-confirm" type="button" data-action="confirm-progression-card-picker" ${selectedCardId ? "" : "disabled"}>Confirmar carta</button></section></div>`;
}

export function renderTierExperienceModal(dependencies: ProgressionDialogDependencies): string {
  const { state, escapeHtml } = dependencies;
  if (!state.progressionTierExperienceOpen) return "";
  const experience = state.progressionTierExperience;
  return `<div class="modal-backdrop" data-modal-backdrop><section class="progression-picker-modal tier-experience-modal" role="dialog" aria-modal="true" aria-labelledby="tier-experience-title"><button class="modal-close" data-modal-close aria-label="Fechar experiencia de Tier">x</button><span class="resource-modal-label">Conquista de Tier</span><h2 id="tier-experience-title">Nova Experiencia +2</h2><p>Escolha uma experiencia que represente o marco alcançado pelo personagem.</p><label class="form-field"><span>Nome *</span><input data-tier-experience-name value="${escapeHtml(experience?.name ?? "")}" placeholder="Ex.: Defensor das muralhas" /></label><label class="form-field"><span>Descricao</span><textarea data-tier-experience-description placeholder="Como essa experiencia ajuda o personagem?">${escapeHtml(experience?.description ?? "")}</textarea></label>${state.progressionTierExperienceError ? `<p class="form-error">${escapeHtml(state.progressionTierExperienceError)}</p>` : ""}<button class="primary-action" type="button" data-action="save-tier-experience">Definir experiencia +2</button></section></div>`;
}

export function renderProgressionMulticlassModal(dependencies: ProgressionDialogDependencies): string {
  const { state, escapeHtml, getEligibleMulticlassClasses, subclasses, features, findDomainName } = dependencies;
  const character = state.character;
  if (!character || !state.progressionMulticlassOpen) return "";
  const classes = getEligibleMulticlassClasses(character);
  const selectedClass = classes.find((entry) => entry.id === state.progressionMulticlassDraft.classId) ?? classes[0];
  const selectedDomainId = state.progressionMulticlassDraft.domainId ?? selectedClass?.domainIds[0];
  const classFeatures = features.filter((entry) => entry.sourceType === "class" && entry.sourceId === selectedClass?.id && entry.tier === "class");
  const selectedFeatureId = state.progressionMulticlassDraft.featureId ?? classFeatures[0]?.id;
  const classSubclasses = subclasses.filter((entry) => entry.classId === selectedClass?.id);
  const selectedSubclass = classSubclasses.find((entry) => entry.id === state.progressionMulticlassDraft.subclassId) ?? classSubclasses[0];
  const foundationFeatures = features.filter((entry) => entry.sourceType === "subclass" && entry.sourceId === selectedSubclass?.id && entry.tier === "foundation");
  const selectedFoundationId = state.progressionMulticlassDraft.foundationFeatureId ?? foundationFeatures[0]?.id;
  const incomplete = !selectedClass || !selectedDomainId || !selectedFeatureId || !selectedSubclass || !selectedFoundationId;
  return `<div class="modal-backdrop" data-modal-backdrop><section class="progression-picker-modal multiclass-picker-modal" role="dialog" aria-modal="true" aria-labelledby="multiclass-picker-title"><button class="modal-close" data-modal-close aria-label="Fechar Multiclasse">x</button><span class="resource-modal-label">Avanço de dois espaços</span><h2 id="multiclass-picker-title">Escolher Multiclasse</h2><p>Escolha uma segunda classe, um de seus Domínios, uma característica de classe e uma Fundação de subclasse. Esta escolha ocupa os dois avanços deste nível.</p>${classes.length ? `<div class="form-grid"><label class="form-field"><span>Classe adicional</span><select data-progression-multiclass-class>${classes.map((entry) => `<option value="${escapeHtml(entry.id)}" ${entry.id === selectedClass.id ? "selected" : ""}>${escapeHtml(entry.name)}</option>`).join("")}</select></label><label class="form-field"><span>Domínio da Multiclasse</span><select data-progression-multiclass-domain>${selectedClass.domainIds.map((id) => `<option value="${escapeHtml(id)}" ${id === selectedDomainId ? "selected" : ""}>${escapeHtml(findDomainName(id) ?? id)}</option>`).join("")}</select></label><label class="form-field"><span>Característica de classe</span><select data-progression-multiclass-feature>${classFeatures.map((entry) => `<option value="${escapeHtml(entry.id)}" ${entry.id === selectedFeatureId ? "selected" : ""}>${escapeHtml(entry.name)}</option>`).join("")}</select></label><label class="form-field"><span>Subclasse para Fundação</span><select data-progression-multiclass-subclass>${classSubclasses.map((entry) => `<option value="${escapeHtml(entry.id)}" ${entry.id === selectedSubclass?.id ? "selected" : ""}>${escapeHtml(entry.name)}</option>`).join("")}</select></label><label class="form-field"><span>Fundação da subclasse</span><select data-progression-multiclass-foundation>${foundationFeatures.map((entry) => `<option value="${escapeHtml(entry.id)}" ${entry.id === selectedFoundationId ? "selected" : ""}>${escapeHtml(entry.name)}</option>`).join("")}</select></label></div><button class="primary-action" type="button" data-action="confirm-progression-multiclass" ${incomplete ? "disabled" : ""}>Adicionar Multiclasse</button>` : `<p class="form-error">Nenhuma outra classe está disponível no Compendium.</p>`}</section></div>`;
}
