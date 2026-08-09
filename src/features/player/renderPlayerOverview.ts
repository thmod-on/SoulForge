import type { CardDefinition, Character, CharacterSkill } from "../../domain/types";
import type { ActiveGameMarker } from "../game-markers/gameMarkerSync";
import { renderGameMarkers } from "../game-markers/renderGameMarkers";

export type PlayerOverviewDependencies = {
  escapeHtml: (value: string) => string;
  renderResources: (character: Character) => string;
  renderEmptyInline: (message: string) => string;
  getActiveCards: (character: Character) => CardDefinition[];
  getInactiveCardCount: (character: Character) => number;
  getStoredCards: (character: Character) => CardDefinition[];
  getAcquiredSubclassTiers: (character: Character) => Array<NonNullable<CharacterSkill["tier"]>>;
  getActiveGameMarkers: (character: Character) => ActiveGameMarker[];
};

export function renderOverview(character: Character, dependencies: PlayerOverviewDependencies): string {
  const activeCards = dependencies.getActiveCards(character);
  const inactiveCards = dependencies.getInactiveCardCount(character);
  const gameMarkers = dependencies.getActiveGameMarkers(character);
  const hasSessionReset = gameMarkers.some((marker) => marker.definition.reset === "session");
  return `<main class="content">${dependencies.renderResources(character)}${renderGameMarkers(gameMarkers, dependencies.escapeHtml)}${renderSubclassTrack(character, dependencies)}<section class="band"><div class="section-heading"><h2>Cartas ativas</h2><span>${activeCards.length} / 5 ativas</span></div><div class="card-row">${activeCards.map((card) => renderCardTile(card, dependencies)).join("")}</div><button class="deck-drawer-button" data-action="open-stored-cards">Ver Vault (${inactiveCards})</button></section><section class="quick-actions"><button data-action="rest-short"><span>REST</span> Descansar breve</button><button data-action="rest-long"><span>FULL</span> Descansar longo</button>${hasSessionReset ? '<button data-action="reset-game-markers-session"><span>NEW</span> Nova sessao</button>' : ""}<button data-page="skills"><span>XP</span> Registrar experiencia</button></section></main>`;
}

export function renderStoredCards(character: Character, dependencies: PlayerOverviewDependencies): string {
  const storedCards = dependencies.getStoredCards(character);
  return `<main class="content"><section class="band"><div class="screen-title"><div><h1>Vault</h1><p>Cartas aprendidas pelo personagem que nao estao ativas no Loadout.</p></div></div><div class="section-heading"><h2>Cartas no Vault</h2><span>${storedCards.length} no Vault</span></div>${storedCards.length ? `<div class="card-row stored-card-row">${storedCards.map((card) => renderStoredCardTile(card, dependencies)).join("")}</div>` : dependencies.renderEmptyInline("O Vault esta vazio por enquanto.")}</section></main>`;
}

export function renderCardTile(card: CardDefinition, dependencies: Pick<PlayerOverviewDependencies, "escapeHtml">): string {
  const { escapeHtml } = dependencies;
  return `<button class="ability-card" data-card-modal-id="${card.id}"><div class="card-tier" aria-label="Tier ${card.tier}"><small>Tier</small><strong>${card.tier}</strong></div><div class="card-recall" aria-label="Custo de recall: ${card.recallCost ?? 0} Stress" title="Custo de recall: ${card.recallCost ?? 0} Stress"><span aria-hidden="true">⚡</span><strong>${card.recallCost ?? 0}</strong></div><div class="card-art ${card.image ? "has-image" : ""}" ${card.image ? `style="background-image: url('${escapeHtml(card.image)}')"` : ""}></div><h3>${escapeHtml(card.name)}</h3><span>${escapeHtml(card.cardType)}</span><p>${escapeHtml(card.summary)}</p></button>`;
}

function renderSubclassTrack(character: Character, dependencies: PlayerOverviewDependencies): string {
  const stages: Array<{ tier: NonNullable<CharacterSkill["tier"]>; label: string; unlockLevel: number; unlockTier: string }> = [
    { tier: "foundation", label: "Fundacao", unlockLevel: 1, unlockTier: "Tier 1" },
    { tier: "specialized", label: "Especializacao", unlockLevel: 5, unlockTier: "Tier 3" },
    { tier: "mastery", label: "Maestria", unlockLevel: 8, unlockTier: "Tier 4" }
  ];
  const acquired = dependencies.getAcquiredSubclassTiers(character);
  const cards = stages.map((stage) => {
    const skill = character.skills.find((entry) => entry.source === "class" && entry.tier === stage.tier);
    const isActive = acquired.includes(stage.tier);
    const isEligible = !isActive && character.identity.level >= stage.unlockLevel;
    const status = isActive ? "Ativa" : isEligible ? "Disponivel como avanço" : `Bloqueada - ${stage.unlockTier} (nivel ${stage.unlockLevel})`;
    return `<article class="subclass-track-card ${isActive ? "is-active" : "is-locked"}"><span class="subclass-track-stage">${stage.label}</span><h3>${dependencies.escapeHtml(skill?.name ?? `Carta de ${stage.label}`)}</h3><p>${dependencies.escapeHtml(skill?.description ?? "Caracteristica da subclasse ainda nao definida.")}</p><small>${status}</small></article>`;
  });
  return `<section class="band subclass-track-band"><div class="section-heading"><div><h2>${dependencies.escapeHtml(character.identity.subclassName ?? "Subclasse nao definida")}</h2></div></div><div class="subclass-track-grid">${cards.join("")}</div></section>`;
}

function renderStoredCardTile(card: CardDefinition, dependencies: PlayerOverviewDependencies): string {
  return `<article class="stored-card">${renderCardTile(card, dependencies)}<button class="stored-card-action icon-action" type="button" data-action="activate-stored-card" data-card-id="${card.id}" aria-label="Ativar ${dependencies.escapeHtml(card.name)} no Loadout" title="Ativar no Loadout">↥</button></article>`;
}
