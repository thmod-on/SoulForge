import type { CardDefinition, Character, CharacterSkill, FeatureActivationDefinition } from "../../domain/types";
import type { ActiveGameMarker } from "../game-markers/gameMarkerSync";
import { renderGameMarkers } from "../game-markers/renderGameMarkers";
import type { ActiveFeatureEffect } from "../feature-effects/featureEffects";
import { renderActiveFeatureEffects } from "../feature-effects/renderActiveFeatureEffects";

export type PlayerOverviewDependencies = {
  escapeHtml: (value: string) => string;
  renderResources: (character: Character) => string;
  renderEmptyInline: (message: string) => string;
  getActiveCards: (character: Character) => CardDefinition[];
  getInactiveCardCount: (character: Character) => number;
  getStoredCards: (character: Character) => CardDefinition[];
  getAcquiredSubclassTiers: (character: Character) => Array<NonNullable<CharacterSkill["tier"]>>;
  getActiveGameMarkers: (character: Character) => ActiveGameMarker[];
  getActiveFeatureEffects: (character: Character) => ActiveFeatureEffect[];
  getFeatureActivation: (character: Character, featureId: string) => FeatureActivationDefinition | undefined;
  featureActivationError?: string;
  getSubclassStageSkills: (character: Character, tier: NonNullable<CharacterSkill["tier"]>) => CharacterSkill[];
  modalCardId?: string;
};

export function renderOverview(character: Character, dependencies: PlayerOverviewDependencies): string {
  const activeCards = dependencies.getActiveCards(character);
  const inactiveCards = dependencies.getInactiveCardCount(character);
  const gameMarkers = dependencies.getActiveGameMarkers(character);
  const activeFeatureEffects = dependencies.getActiveFeatureEffects(character);
  const hasSessionReset = gameMarkers.some((marker) => marker.definition.reset === "session");
  return `<main class="content">${renderActiveFeatureEffects(character, activeFeatureEffects, dependencies.escapeHtml)}${dependencies.renderResources(character)}${renderGameMarkers(gameMarkers, dependencies.escapeHtml)}<section class="band"><div class="section-heading"><h2>Cartas ativas</h2><span>${activeCards.length} / 5 ativas</span></div><div class="card-row">${activeCards.map((card) => renderCardTile(card, dependencies)).join("")}</div><button class="sf-action sf-action--secondary deck-drawer-button" data-action="open-stored-cards">Ver Vault (${inactiveCards})</button></section>${renderSubclassTrack(character, dependencies)}${renderMulticlassTrack(character, dependencies)}<section class="quick-actions"><button class="sf-action sf-action--secondary" data-action="open-rest" aria-label="Abrir downtime" title="Downtime"><span aria-hidden="true">🛏</span> Downtime</button>${hasSessionReset ? '<button class="sf-action sf-action--secondary" data-action="reset-game-markers-session"><span>NEW</span> Nova sessao</button>' : ""}<button class="sf-action sf-action--secondary" data-page="skills"><span>XP</span> Registrar experiencia</button></section></main>${renderSubclassFeatureModal(character, dependencies)}`;
}

export function renderStoredCards(character: Character, dependencies: PlayerOverviewDependencies): string {
  const storedCards = dependencies.getStoredCards(character);
  return `<main class="content vault-content"><section class="band"><div class="screen-title"><div><h1>Vault</h1><p>Cartas aprendidas pelo personagem que nao estao ativas no Loadout.</p></div></div><div class="section-heading"><h2>Cartas no Vault</h2><span>${storedCards.length} no Vault</span></div>${storedCards.length ? `<div class="card-row stored-card-row">${storedCards.map((card) => renderStoredCardTile(card, dependencies)).join("")}</div>` : dependencies.renderEmptyInline("O Vault esta vazio por enquanto.")}</section></main>`;
}

export function renderCardTile(card: CardDefinition, dependencies: Pick<PlayerOverviewDependencies, "escapeHtml">): string {
  const { escapeHtml } = dependencies;
  return `<button class="ability-card" data-card-modal-id="${card.id}"><div class="card-tier" aria-label="Nível ${card.tier}"><small>Nível</small><strong>${card.tier}</strong></div><div class="card-recall" aria-label="Custo de recall: ${card.recallCost ?? 0} Stress" title="Custo de recall: ${card.recallCost ?? 0} Stress"><span aria-hidden="true">⚡</span><strong>${card.recallCost ?? 0}</strong></div><div class="card-art ${card.image ? "has-image" : ""}" ${card.image ? `style="background-image: url('${escapeHtml(card.image)}')"` : ""}></div><h3>${escapeHtml(card.name)}</h3><span>${escapeHtml(card.cardType)}</span><p>${escapeHtml(card.summary)}</p></button>`;
}

function renderSubclassTrack(character: Character, dependencies: PlayerOverviewDependencies): string {
  const stages: Array<{ tier: NonNullable<CharacterSkill["tier"]>; label: string; unlockLevel: number; unlockTier: string }> = [
    { tier: "foundation", label: "Fundacao", unlockLevel: 1, unlockTier: "Tier 1" },
    { tier: "specialized", label: "Especializacao", unlockLevel: 5, unlockTier: "Tier 3" },
    { tier: "mastery", label: "Maestria", unlockLevel: 8, unlockTier: "Tier 4" }
  ];
  const acquired = dependencies.getAcquiredSubclassTiers(character);
  const cards = stages.map((stage) => {
    const skills = dependencies.getSubclassStageSkills(character, stage.tier);
    const isActive = acquired.includes(stage.tier);
    const isEligible = !isActive && character.identity.level >= stage.unlockLevel;
    const status = isActive ? "Ativa" : isEligible ? "Disponivel como avanço" : `Bloqueada - ${stage.unlockTier} (nivel ${stage.unlockLevel})`;
    const names = skills.length ? skills.map((skill) => dependencies.escapeHtml(skill.name)).join(" · ") : `Feature de ${stage.label}`;
    return `<button class="subclass-track-card ${isActive ? "is-active" : "is-locked"}" type="button" data-card-modal-id="subclass-feature:${stage.tier}" aria-label="Ver detalhes de ${dependencies.escapeHtml(stage.label)}"><span class="subclass-track-stage">${stage.label}</span><h3>${names}</h3><small>${status}</small></button>`;
  });
  return `<section class="band subclass-track-band"><div class="section-heading"><div><h2>${dependencies.escapeHtml(character.identity.subclassName ?? "Subclasse nao definida")}</h2></div></div><div class="subclass-track-grid">${cards.join("")}</div></section>`;
}

function renderSubclassFeatureModal(character: Character, dependencies: PlayerOverviewDependencies): string {
  const selectedTier = dependencies.modalCardId?.startsWith("subclass-feature:") ? dependencies.modalCardId.replace("subclass-feature:", "") as CharacterSkill["tier"] : undefined;
  if (!selectedTier) return "";
  const stage = ({ foundation: { label: "Fundação", unlockLevel: 1 }, specialized: { label: "Especialização", unlockLevel: 5 }, mastery: { label: "Maestria", unlockLevel: 8 } } as const)[selectedTier];
  if (!stage) return "";
  const skills = dependencies.getSubclassStageSkills(character, selectedTier);
  const activeEffects = new Set(dependencies.getActiveFeatureEffects(character).map((effect) => effect.feature.id));
  return `<div class="modal-backdrop" data-modal-backdrop><section class="class-detail-modal subclass-feature-modal" role="dialog" aria-modal="true" aria-labelledby="subclass-feature-modal-title"><button class="modal-close" data-modal-close aria-label="Fechar detalhes da feature">x</button><div class="class-detail-body"><span class="resource-modal-label">${dependencies.escapeHtml(stage.label)}</span><h2 id="subclass-feature-modal-title">${dependencies.escapeHtml(character.identity.subclassName ?? "Subclasse")}</h2><section class="class-detail-section"><div class="class-detail-feature-grid">${skills.length ? skills.map((skill) => { const activation = dependencies.getFeatureActivation(character, skill.id); const active = activeEffects.has(skill.id); return `<article class="class-detail-feature"><h3>${dependencies.escapeHtml(skill.name)}</h3><p>${dependencies.escapeHtml(skill.description)}</p>${activation ? `<button class="feature-activation-button" type="button" data-action="activate-feature-effect" data-feature-id="${dependencies.escapeHtml(skill.id)}" ${active ? "disabled" : ""}>${active ? "Efeito ativo" : dependencies.escapeHtml(activation.label)}</button>` : ""}</article>`; }).join("") : '<p class="class-detail-summary">Nenhuma feature foi encontrada para esta etapa.</p>'}</div></section>${dependencies.featureActivationError ? `<p class="form-error">${dependencies.escapeHtml(dependencies.featureActivationError)}</p>` : ""}</div></section></div>`;
}

function renderMulticlassTrack(character: Character, dependencies: PlayerOverviewDependencies): string {
  const multiclass = character.progression?.multiclass;
  if (!multiclass) return "";
  return `<section class="band subclass-track-band multiclass-track-band"><div class="section-heading"><div><h2>Multiclasse — ${dependencies.escapeHtml(multiclass.className)}</h2><span>${dependencies.escapeHtml(multiclass.domainName)}</span></div></div><div class="subclass-track-grid"><article class="subclass-track-card is-active"><span class="subclass-track-stage">Característica de classe</span><h3>${dependencies.escapeHtml(multiclass.featureName)}</h3><small>Ativa</small></article><article class="subclass-track-card is-active"><span class="subclass-track-stage">Fundação — ${dependencies.escapeHtml(multiclass.subclassName)}</span><h3>${dependencies.escapeHtml(multiclass.foundationFeatureName)}</h3><small>Ativa</small></article></div></section>`;
}

function renderStoredCardTile(card: CardDefinition, dependencies: PlayerOverviewDependencies): string {
  return `<article class="stored-card">${renderCardTile(card, dependencies)}<button class="stored-card-action icon-action" type="button" data-action="activate-stored-card" data-card-id="${card.id}" aria-label="Ativar ${dependencies.escapeHtml(card.name)} no Loadout" title="Ativar no Loadout">↥</button></article>`;
}
