import type { Character } from "../../domain/types";
import type { ProgressionTierNumber } from "../../app/types";
import { progressionTiers } from "./progressionRules";

type ProgressionTier = (typeof progressionTiers)[number];

export type ProgressionViewState = {
  selectedProgressionTier: ProgressionTierNumber;
};

export type ProgressionRenderDependencies = {
  state: ProgressionViewState;
  escapeHtml: (value: string) => string;
  progressPercent: (value: number, max: number) => number;
  getTierForLevel: (level: number) => ProgressionTierNumber;
  renderProgressionOptions: (character: Character, isCurrentTier: boolean) => string;
  renderProgressionDomainStep: (character: Character) => string;
  renderProgressionDraft: (character: Character) => string;
};

export function renderProgression(character: Character, dependencies: ProgressionRenderDependencies): string {
  const { state, progressPercent, getTierForLevel } = dependencies;
  const nextLevel = Math.min(character.identity.level + 1, 10);
  const currentTier = getTierForLevel(nextLevel);
  const selectedTier = progressionTiers.find((tier) => tier.tier === state.selectedProgressionTier) ?? progressionTiers[0];

  return `<main class="content progression-content"><div class="screen-title"><div><h1>Progressao</h1></div></div><div class="progression-bar" aria-label="Tiers de progressao"><div class="progression-character-status" aria-label="Nivel e experiencia do personagem"><strong>Nivel ${character.identity.level}</strong><span>${character.identity.xp} / ${character.identity.nextLevelXp} XP</span><div class="progression-xp-bar" aria-hidden="true"><i style="width: ${progressPercent(character.identity.xp, character.identity.nextLevelXp)}%"></i></div></div><div class="progression-tabs" role="tablist" aria-label="Tiers de progressao">${progressionTiers.map((tier) => `<button class="${state.selectedProgressionTier === tier.tier ? "is-active" : ""}" type="button" data-action="select-progression-tier" data-progression-tier="${tier.tier}"><strong>Tier ${tier.tier}</strong><span>Niveis ${tier.levels}</span></button>`).join("")}</div></div><section class="progression-board">${renderProgressionTier(selectedTier, character, currentTier, dependencies)}</section></main>`;
}

function renderProgressionTier(tier: ProgressionTier, character: Character, currentTier: ProgressionTierNumber, dependencies: ProgressionRenderDependencies): string {
  const { escapeHtml, renderProgressionOptions, renderProgressionDomainStep, renderProgressionDraft } = dependencies;
  const currentLevel = character.identity.level;
  const endLevel = Number(tier.levels.split("-")[1]);
  const isCurrentTier = currentTier === tier.tier;
  const isPastTier = currentLevel > endLevel;
  const statusLabel = isPastTier ? "Concluido" : isCurrentTier ? "Atual" : "Bloqueado";
  return `<article class="progression-tier ${isCurrentTier ? "is-current" : ""} ${isPastTier ? "is-complete" : ""}"><div class="progression-tier-header"><p class="progression-tier-headline">${escapeHtml(tier.headline)}</p><button class="progression-history-button" type="button" data-action="open-progression-history">Ver historico</button></div><div class="progression-tier-meta"><span>${tier.choices} escolhas</span><span>${statusLabel}</span></div>${isCurrentTier ? `<div class="progression-workspace"><div class="progression-elective-panel">${renderProgressionOptions(character, isCurrentTier)}</div>${renderProgressionDomainStep(character)}</div>` : `<div class="progression-elective-panel">${renderProgressionOptions(character, isCurrentTier)}</div>`}${isCurrentTier ? renderProgressionDraft(character) : ""}<p class="progression-tier-footer">${escapeHtml(isCurrentTier ? "Selecione dois avanços e confirme antes de alterar a ficha." : tier.footer)}</p></article>`;
}
